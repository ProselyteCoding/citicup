import logging
import sys
import os

# 添加大模型目录到路径
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.join(os.path.dirname(current_dir), 'ml')
sys.path.append(ml_dir)

# dym分割线-------------------------------------------------

#主要风险敞口 
#输入json 输出高中低风险（三选一）----------------------
def determine_risk_level(proportion, daily_volatility):
    # 根据持仓比例判断风险等级
    if proportion > 1 / 3:
        proportion_risk = '高风险'
    elif proportion > 1 / 4:
        proportion_risk = '中到高风险'
    else:
        proportion_risk = '低风险'

    # 根据波动率判断风险等级
    if daily_volatility > 0.02:
        volatility_risk = '高风险'
    elif daily_volatility > 0.01:
        volatility_risk = '中风险'
    else:
        volatility_risk = '低风险'

    # 只要满足一个条件就判断为高风险
    if '高风险' in [proportion_risk, volatility_risk]:
        return '高风险'
    elif '中到高风险' in [proportion_risk, volatility_risk] or '中风险' in [proportion_risk, volatility_risk]:
        return '中到高风险'
    else:
        return '低风险'


#压力测试接口-----------------------------------------
#输入：json（在函数中是proportion）+场景描述（在函数中是scenario）
#输出 潜在损失 影响程度 发生概率 对冲建议这四个
from langchain_openai import ChatOpenAI
from langgraph.graph import MessagesState
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException
from langgraph.graph import START, StateGraph
import os

# 封装情景分析函数
def yali_scenario_analyzer(proportion, scenario, model_name: str = "gpt-4o-mini") -> dict:
    # 动态设置API配置
    api_key = 'sk-GQLASa7Vc1lY6NC9pw9X0OMpuct3i6eJz3CcHKfqAvwp5Xws'
    api_base = 'https://api.chatanywhere.tech/v1'
    os.environ['OPENAI_API_KEY'] = api_key
    os.environ['OPENAI_API_BASE'] = api_base

    # 定义输入输出模型
    class CurrencyPosition(BaseModel):
        currency: str = Field(description="货币对")
        quantity: int = Field(description="持仓量")
        proportion: float = Field(description="持仓比例")
        benefit: float = Field(description="收益")
        dailyVolatility: float = Field(description="日波动率")
        valueAtRisk: str = Field(description="风险价值")
        beta: float = Field(description="贝塔值")
        hedgingCost: float = Field(description="对冲成本")

    class ScenarioAnalysisInput(BaseModel):
        scenario: str = Field(description="需要分析的经济情景")
        positions: list[CurrencyPosition] = Field(description="货币持仓信息")

    class ScenarioAnalysisOutput(BaseModel):
        scenario: str = Field(description="情景描述")
        influence: str = Field(description="影响程度，高/中/低")
        probability: float = Field(description="发生概率，0-1之间")
        suggestion: str = Field(description="对冲建议")
        money: float = Field(description="潜在损失")

    # 定义输出解析器
    parser = JsonOutputParser(pydantic_object=ScenarioAnalysisOutput)

    # 定义情景分析专用Prompt
    prompt = f'''
    你是一个专业的金融市场情景分析专家，专注于评估宏观经济事件对外汇市场的影响。你的任务是根据用户提供的情景，进行以下分析：

    1. 影响程度评估
       判断该情景对当前外汇市场的潜在影响（高/中/低）

    2. 概率预测
       预测该情景在未来6个月内发生的概率（0-1之间的数值）

    3. 对冲策略建议
       根据情景特点提供具体的对冲措施（如调整持仓比例、选择特定货币对等）

    4.潜在损失评估
      根据情景特点评估可能损失的金额（单位是美金）

    输入格式：
    {{
      "scenario": "情景描述（如'美联储加息100bp'）"
    }}

    输出格式：
    {{
      "scenario": "原情景描述",
      "money": "潜在损失",
      "influence": "影响程度",
      "probability": 发生概率,
      "suggestion": "对冲建议"
    }}

    重要原则：
    - 结合当前市场条件与历史数据进行专业分析
    - 概率评估需考虑经济政策、市场情绪等多维度因素
    - 对冲建议要具体、可操作，适合交易员立即执行
    '''

    # 定义系统消息
    sys_msg = SystemMessage(content=prompt)

    # 初始化语言模型
    llm = ChatOpenAI(model=model_name)

    # 定义大模型节点
    def assistant(state: MessagesState):
        messages = state["messages"]
        response = llm.invoke([sys_msg] + messages)
        return {"messages": messages + [response]}

    # 实现ReAct架构
    builder = StateGraph(MessagesState)
    builder.add_node("assistant", assistant)
    builder.add_edge(START, "assistant")

    # 添加一个终止节点
    builder.add_node("END", lambda state: None)
    builder.add_edge("assistant", "END")

    react_graph = builder.compile()

    # 构建输入数据
    input_dict = {
        "scenario": scenario,
        "positions": proportion
    }

    # 执行情景分析
    input_model = ScenarioAnalysisInput(**input_dict)
    message = [HumanMessage(content=input_model.model_dump_json())]

    result_raw = react_graph.invoke({"messages": message})

    try:
        output = parser.parse(result_raw['messages'][-1].content)

        # 兼容不同的情况
        if isinstance(output, dict):
            output = ScenarioAnalysisOutput(**output)  # 转换回 Pydantic 对象

        return output.model_dump()  # Pydantic v2 兼容
    except OutputParserException as e:
        print(f"解析错误: {e}")
        raise


#货币预测
#输入 scenario（货币对 比如说usd/chi）
#输出 最高和最低是多少（都是用数字表示出来）

from langchain_openai import ChatOpenAI
from langgraph.graph import MessagesState
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException
from langgraph.graph import START, StateGraph

# 封装情景分析函数
def huobi_scenario_analyzer(scenario: str) -> dict:
    # 设置API密钥和端点
    api_key = 'sk-GQLASa7Vc1lY6NC9pw9X0OMpuct3i6eJz3CcHKfqAvwp5Xws'
    api_base = 'https://api.chatanywhere.tech/v1'
    
    # 注意：如果链接解析失败，可能是链接本身或网络问题，请检查链接的合法性并适当重试
    try:
        import requests
        response = requests.get(api_base)
        if response.status_code != 200:
            print(f"链接解析失败，状态码：{response.status_code}。可能是链接本身或网络问题，请检查链接的合法性并适当重试。")
    except Exception as e:
        print(f"链接解析失败，错误信息：{e}。可能是链接本身或网络问题，请检查链接的合法性并适当重试。")
    
    os.environ['OPENAI_API_KEY'] = api_key
    os.environ['OPENAI_API_BASE'] = api_base

    # 定义模型
    model_name = "gpt-4o-mini"
    llm = ChatOpenAI(model=model_name)

    # 定义输入输出模型
    class ScenarioAnalysisInput(BaseModel):
        scenario: str = Field(description="需要分析的货币对")

    class ScenarioAnalysisOutput(BaseModel):
        upper: float = Field(description="预测上限")
        lower: float = Field(description="预测下限")

    # 定义输出解析器
    parser = JsonOutputParser(pydantic_object=ScenarioAnalysisOutput)

    # 定义情景分析专用Prompt
    prompt = f'''
    你是一个专业的金融市场情景分析专家，专注于评估宏观经济事件对外汇市场的影响。你的任务是根据用户提供的货币对，预测单一货币对回测分析

    输入格式：
    {{
      "scenario": "货币对类型（如'EUR/USD'）"
    }}

    输出格式：
    {{
      "upper": "预测上限",
      "lower": "预测下限",
    }}

    重要原则：
    - 结合当前市场条件与历史数据进行专业分析
    - 概率评估需考虑经济政策、市场情绪等多维度因素
    '''

    # 定义系统消息
    sys_msg = SystemMessage(content=prompt)

    # 定义大模型节点
    def assistant(state: MessagesState):
        messages = state["messages"]
        response = llm.invoke([sys_msg] + messages)
        return {"messages": messages + [response]}

    # 实现ReAct架构
    builder = StateGraph(MessagesState)
    builder.add_node("assistant", assistant)
    builder.add_edge(START, "assistant")

    # 添加一个终止节点
    builder.add_node("END", lambda state: None)
    builder.add_edge("assistant", "END")

    react_graph = builder.compile()

    # 构建输入数据
    input_dict = {"scenario": scenario}
    input_model = ScenarioAnalysisInput(**input_dict)
    message = [HumanMessage(content=input_model.model_dump_json())]

    result_raw = react_graph.invoke({"messages": message})

    try:
        output = parser.parse(result_raw['messages'][-1].content)

        # 兼容不同的情况
        if isinstance(output, dict):
            output = ScenarioAnalysisOutput(**output)  # 转换回 Pydantic 对象

        return output.model_dump()  # Pydantic v2 兼容
    except OutputParserException as e:
        print(f"解析错误: {e}")
        raise



#风险信号分析
#输入 ：还是json格式的proportion
#输出  是
      # "current": {{  
      #   "credit": "信用风险值 (0-10)",          
      #   "policy": "政策风险值 (0-10)",            
      #   "market": "市场流动性风险值 (0-10)",            
      #   "politician": "政治风险值 (0-10)",      
      #   "economy": "经济风险值 (0-10)"       
      # }},
      # "warning": {{  
      #    "credit": "预警阈值信用风险值 (0-10)",          
      #   "policy": "预警阈值政策风险值 (0-10)",            
      #   "market": "预警阈值市场流动性风险值 (0-10)",            
      #   "politician": "预警阈值政治风险值 (0-10)",      
      #   "economy": "预警阈值经济风险值 (0-10)" 
      # }}
from langchain_openai import ChatOpenAI
from langgraph.graph import MessagesState
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException
from langgraph.graph import START, StateGraph
import os

# 封装风险信号分析函数
def risk_signal_analysis(proportion: list) -> dict:
    # 设置API密钥和端点
    api_key = 'sk-GQLASa7Vc1lY6NC9pw9X0OMpuct3i6eJz3CcHKfqAvwp5Xws'
    api_base = 'https://api.chatanywhere.tech/v1'
    
    # 注意：如果链接解析失败，可能是链接本身或网络问题，请检查链接的合法性并适当重试
    try:
        import requests
        response = requests.get(api_base)
        if response.status_code != 200:
            print(f"链接解析失败，状态码：{response.status_code}。可能是链接本身或网络问题，请检查链接的合法性并适当重试。")
    except Exception as e:
        print(f"链接解析失败，错误信息：{e}。可能是链接本身或网络问题，请检查链接的合法性并适当重试。")
    
    os.environ['OPENAI_API_KEY'] = api_key
    os.environ['OPENAI_API_BASE'] = api_base

    # 定义模型
    model_name = "gpt-4o-mini"
    llm = ChatOpenAI(model=model_name)

    # 定义输入输出模型
    class CurrencyPosition(BaseModel):
        currency: str = Field(description="货币对")
        quantity: int = Field(description="持仓量")
        proportion: float = Field(description="持仓比例")
        benefit: float = Field(description="收益")
        dailyVolatility: float = Field(description="日波动率")
        valueAtRisk: str = Field(description="风险价值")
        beta: float = Field(description="贝塔值")
        hedgingCost: float = Field(description="对冲成本")

    class ScenarioAnalysisInput(BaseModel):
        positions: list[CurrencyPosition] = Field(description="货币持仓信息")

    class RiskValues(BaseModel):
        credit: float = Field(description="风险值，0-10之间")
        policy: float = Field(description="风险值，0-10之间")
        market: float = Field(description="风险值，0-10之间")
        politician: float = Field(description="风险值，0-10之间")
        economy: float = Field(description="风险值，0-10之间")

    class ScenarioAnalysisOutput(BaseModel):
        current: RiskValues
        warning: RiskValues

    # 定义输出解析器
    parser = JsonOutputParser(pydantic_object=ScenarioAnalysisOutput)

    # 定义情景分析专用Prompt
    prompt = f'''
    你是一名专业的金融市场情景分析专家，专注于评估宏观经济事件对外汇市场的影响。你的任务是基于用户提供的情景，结合当前市场数据，对不同货币的信用风险进行全面分析，并提供量化评估。

    ### **信用风险评估模型**
    请基于历史数据、市场表现和政策影响，对以下五大核心风险进行评估，并给出 **风险值（0-10）** 及其 **预警阈值**（超过阈值即存在潜在风险）：

    1. **政策风险（Policy Risk）**
       - 评估当前货币所处的国家/地区货币政策变动风险，如利率调整、货币宽松或紧缩政策等。
       - 风险值范围：0（无风险）- 10（极高风险）

    2. **市场流动性（Market Liquidity Risk）**
       - 评估该货币市场的流动性，是否存在大额交易难以执行、市场深度不足等问题。
       - 风险值范围：0（市场流动性充足）- 10（市场流动性极差）

    3. **政治风险（Political Risk）**
       - 评估该货币所在国的政治稳定性，包括政府更迭、地缘政治冲突、国际制裁等因素。
       - 风险值范围：0（政治环境稳定）- 10（高度不稳定）

    4. **经济风险（Economic Risk）**
       - 评估该货币所在国家的经济基本面，包括 GDP 增长、通胀水平、失业率、贸易顺差/逆差等。
       - 风险值范围：0（经济稳健）- 10（经济高度脆弱）

    5. **信用风险（Credit Risk）**
       - 评估该货币对应国家或机构的信用状况，如国家信用评级、违约风险、银行体系稳健性等。
       - 风险值范围：0（信用极佳）- 10（高违约风险）

    ---

    ### **输出格式**
    请按照以下 JSON 结构输出分析结果：

    json
    {{
      "current": {{  
        "credit": "信用风险值 (0-10)",          
        "policy": "政策风险值 (0-10)",            
        "market": "市场流动性风险值 (0-10)",            
        "politician": "政治风险值 (0-10)",      
        "economy": "经济风险值 (0-10)"       
      }},
      "warning": {{  
         "credit": "预警阈值信用风险值 (0-10)",          
        "policy": "预警阈值政策风险值 (0-10)",            
        "market": "预警阈值市场流动性风险值 (0-10)",            
        "politician": "预警阈值政治风险值 (0-10)",      
        "economy": "预警阈值经济风险值 (0-10)" 
      }}
    }}
    '''

    # 定义系统消息
    sys_msg = SystemMessage(content=prompt)

    # 定义大模型节点
    def assistant(state: MessagesState):
        messages = state["messages"]
        response = llm.invoke([sys_msg] + messages)
        return {"messages": messages + [response]}

    # 实现ReAct架构
    builder = StateGraph(MessagesState)
    builder.add_node("assistant", assistant)
    builder.add_edge(START, "assistant")

    # 添加一个终止节点
    builder.add_node("END", lambda state: None)
    builder.add_edge("assistant", "END")

    react_graph = builder.compile()

    # 构建输入数据
    input_dict = {"positions": proportion}
    input_model = ScenarioAnalysisInput(**input_dict)
    message = [HumanMessage(content=input_model.model_dump_json())]

    result_raw = react_graph.invoke({"messages": message})

    try:
        output = parser.parse(result_raw['messages'][-1].content)

        # 兼容不同的情况
        if isinstance(output, dict):
            output = ScenarioAnalysisOutput(**output)  # 转换回 Pydantic 对象

        return output.model_dump()  # Pydantic v2 兼容
    except OutputParserException as e:
        print(f"解析错误: {e}")
        raise



#-----------分割线-----------------


#--------wl写的---------------
#页面二的第二个板块：高风险货币列表
#懒得改他代码了 ，你去找他这个函数def Risk_strategy(input: list) -> dict: 在812行左右
#输入还是json格式的proportion
# 输出（只需要看那个是中低高风险 还有那个上升下降趋势）：{
#     "result": [
#         {"currency": "EUR/USD", "level": "低风险", "tendency": "下降"},
#         {"currency": "USD/JPY", "level": "中风险", "tendency": "上升"},
#         {"currency": "GBP/USD", "level": "中风险", "tendency": "下降"},
#         {"currency": "AUD/USD", "level": "低风险", "tendency": "上升"},
#         {"currency": "USD/CAD", "level": "中风险", "tendency": "下降"},
#         {"currency": "NZD/USD", "level": "低风险", "tendency": "上升"},
#         {"currency": "EUR/GBP", "level": "低风险", "tendency": "下降"},
#         {"currency": "USD/CHF", "level": "中风险", "tendency": "上升"},
#         {"currency": "EUR/JPY", "level": "中风险", "tendency": "下降"},
#         {"currency": "GBP/JPY", "level": "中风险", "tendency": "上升"}
#     ]
# }
from langchain_openai import ChatOpenAI
from langgraph.graph import MessagesState
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field
from typing import Optional,Any
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException
import numpy as np
from typing import Literal
import pandas as pd
from typing import List, Dict, Tuple
from langchain.tools import tool
from langgraph.graph import START, StateGraph
from langgraph.prebuilt import tools_condition
from langgraph.prebuilt import ToolNode
from langchain_core.prompts import PromptTemplate

# https://github.com/chatanywhere/GPT_API_free 免费领取
# os.environ['OPENAI_API_KEY']='sk-GQLASa7Vc1lY6NC9pw9X0OMpuct3i6eJz3CcHKfqAvwp5Xws'
# os.environ['OPENAI_API_BASE']='https://api.chatanywhere.tech/v1'

# 定义大语言模型 可以选择更好的 gpt-o1 模型 需要付费
# model_name="gpt-4o"
# model_name="deepseek-r1"#太jb慢了 还容易报错
# model_name="o1-preview"
#model_name = "deepseek-r1"
model_name = "gpt-4o-mini"

llm = ChatOpenAI(model=model_name)


#定义输出


class RiskItem(BaseModel):
    currency:str = Field(description="货币对，如 EUR/JPY、USD/CHF 等")
    level:  Literal['高风险', '中风险', '低风险'] = Field(description="货币风险等级，只能是：高风险、中风险、低风险")
    tendency: Literal['上升', '不变', '下降'] = Field(description="货币变化趋势，只能是：上升、不变、下降")

class RiskCurrency(BaseModel):
    result: List[RiskItem] = Field(description="每个货币对的风险等级与趋势分析列表")



# 定义输出解析器
parser = JsonOutputParser(pydantic_object=RiskCurrency)
parser.get_format_instructions()

# 定义prompt
prompt = f'''
你是一名金融风险分析助手。
以下是一组货币头寸的数据，每个项目包含货币对、持仓量（quantity）、占投资组合的比例（proportion）、收益（benefit）、日波动率（dailyVolatility）、风险价值（valueAtRisk）、贝塔值（beta）以及对冲成本（hedgingCost）。
{input}
你的任务是对每个货币对做出如下两个判断：

风险等级（Risk Level）：只能是以下三种之一 —— '高风险'、'中风险'、'低风险'
请综合考虑日波动率、风险价值（VaR）、贝塔值等指标，评估该货币头寸的整体风险。
风险变化趋势（Risk Tendency）：只能是以下三种之一 —— '上升'、'不变'、'下降'
请根据收益变化、波动率水平和贝塔可能带来的系统性风险，判断该货币的风险是趋于上升、不变还是下降。
输出格式：
{parser.get_format_instructions()}
'''

# 定义系统消息
sys_msg = SystemMessage(content=prompt)


# 定义工具
def calculate_portfolio_volatility(data: List[Dict]) -> float:
    """
    计算整体持仓组合的波动率（Volatility）。
    使用各货币对的日波动率（dailyVolatility）和其在持仓中的占比（proportion）计算加权平均波动率。
    """
    df = pd.DataFrame(data)
    return np.average(df["dailyVolatility"], weights=df["proportion"])


def determine_market_emotion(volatility: float) -> str:
    """
    根据组合波动率判断市场情绪。
    - 波动率 > 0.1 -> “偏多”
    - 波动率 < 0.05 -> “偏空”
    - 否则 -> “中性”
    """
    if volatility > 0.1:
        return "偏多"
    elif volatility < 0.05:
        return "偏空"
    return "中性"


def assess_risk(data: List[Dict]) -> Tuple[str, Dict]:
    """
    评估持仓组合的风险水平，基于各货币对 VaR（字符串如 '$15,000'），找出 VaR 最大的货币对并返回风险评级。
    - VaR < 15000 -> 低风险
    - 15000 <= VaR < 30000 -> 中风险
    - VaR >= 30000 -> 高风险
    """
    df = pd.DataFrame(data)
    df["VaR_value"] = df["valueAtRisk"].replace({'$': '', ',': ''}, regex=True).astype(float)
    highest_risk = df.loc[df["VaR_value"].idxmax()].to_dict()
    risk_level = "低风险" if highest_risk["VaR_value"] < 15000 else "中风险" if highest_risk["VaR_value"] < 30000 else "高风险"
    return risk_level, highest_risk
@tool
def compute_currency_exposure(data: List[Dict]) -> Optional[float]:
    """
    计算整体货币敞口（currencyExposure）。
    演示用：这里简单地将“加权组合波动率 * 持仓总量”视为货币敞口；如需更复杂逻辑，可自行扩展。

    Args:
        data (List[Dict]): 持仓数据列表，每个元素包含至少 'dailyVolatility', 'proportion', 'quantity' 等字段。

    Returns:
        Optional[float]: 返回根据组合波动率与持仓量估算的货币敞口；如果数据不足则返回 None。
    """
    if not data:
        return None

    portfolio_vol = calculate_portfolio_volatility(data)
    total_quantity = sum(d.get("quantity", 0) for d in data)
    currency_exposure = portfolio_vol * total_quantity
    return currency_exposure


@tool
def compute_term_risk_distribution(data: List[Dict]) -> List[Dict[str, float]]:
    """
    构建账期风险分布（termRiskDistribution）。
    示例：根据组合波动率分别对 30天、60天、90天（或更长）进行不同系数的风险估算。

    Args:
        data (List[Dict]): 持仓数据列表。

    Returns:
        List[Dict[str, float]]: 返回形如 [{"time": 30, "risk": 0.01}, ...] 的列表，包含多期风险估算。
    """
    if not data:
        return []

    portfolio_vol = calculate_portfolio_volatility(data)
    # 下列系数纯属演示：你可根据实际模型或逻辑来计算风险
    distribution = [
        {"time": 30, "risk": round(portfolio_vol * 0.5, 4)},
        {"time": 60, "risk": round(portfolio_vol * 0.8, 4)},
        {"time": 90, "risk": round(portfolio_vol * 1.2, 4)},
    ]
    return distribution


@tool
def compute_risk_transmission_path(data: List[Dict]) -> List[str]:
    """
    构建风险传导路径（riskTransmissionPath）。
    演示用：根据“quantity * dailyVolatility”计算 'risk_factor'，选取前几名货币对并附加数字标签。

    Args:
        data (List[Dict]): 持仓数据列表，每个元素至少包含 'currency', 'quantity', 'dailyVolatility'.

    Returns:
        List[str]: 示例形如 ["JPY30", "GBP40", "USD50"]，代表主要风险传导路径。
    """
    if not data:
        return []

    df = pd.DataFrame(data)
    df["risk_factor"] = df["quantity"] * df["dailyVolatility"]
    df = df.sort_values("risk_factor", ascending=False)

    # 简单演示：取前三个货币对，以 'currency + int(risk_factor/1000)' 为标签
    result = []
    top_risk = df.head(3)
    for _, row in top_risk.iterrows():
        # 去除斜杠或其他符号，拼接大致的风险强度数值
        cleaned_ccy = row["currency"].replace("/", "")
        factor_label = int(row["risk_factor"] / 1000)
        result.append(f"{cleaned_ccy}{factor_label}")

    return result


@tool
def generate_macro_risk_coefficients() -> List[Dict[str, float]]:
    """
    生成宏观风险系数（macroRiskCoefficients）。
    演示用：此函数返回一个示例月份的宏观指标；在实际场景可接入外部数据源或模型。

    Returns:
        List[Dict[str, float]]: 形如 [{"month": 1, "all": 80, "economy": 60, "policy": 40, "market": 20}].
    """
    return [
        {"month": 1, "all": 80.0, "economy": 60.0, "policy": 40.0, "market": 20.0}
    ]


@tool
def generate_risk_signal_analysis(data: List[Dict]) -> Dict[str, Any]:
    """
    生成风险信号分析（riskSignalAnalysis）。
    演示用：结合已存在的工具（如 determine_market_emotion、assess_risk）大致生成当前 & 预警风险值。

    Args:
        data (List[Dict]): 持仓数据列表。

    Returns:
        Dict[str, Any]:
        形如 {
          "current": {"credit":..., "policy":..., ...},
          "warning": {...}
        } 的字典。
    """
    portfolio_vol = calculate_portfolio_volatility(data)
    emotion = determine_market_emotion(portfolio_vol)
    risk_level, highest_risk = assess_risk(data)

    # 根据情绪和风险等级做一个简单映射（纯属示例）
    # 你可以结合业务逻辑，自定义 credit/policy/market/politician/economy 的值
    if emotion == "偏多":
        current = {"credit": 60, "policy": 20, "market": 40, "politician": 30, "economy": 50}
    elif emotion == "偏空":
        current = {"credit": 80, "policy": 30, "market": 20, "politician": 50, "economy": 40}
    else:
        current = {"credit": 70, "policy": 25, "market": 30, "politician": 40, "economy": 45}

    # 简单规则：warning 比 current 各增加 10
    warning = {k: v + 10 for k, v in current.items()}

    return {
        "current": current,
        "warning": warning
    }


@tool
def compute_single_currency_analysis(data: List[Dict]) -> List[Dict[str, float]]:
    """
    根据输入持仓数据，对每个货币对进行单一分析，输出预估的价格区间 upper、lower（演示用）。

    演示中：
    - 假设基准价为 1.0
    - 根据 dailyVolatility 做一个简单波动上下限（vol * 0.05）
    - 可结合实际汇率数据改进本逻辑

    Args:
        data (List[Dict]): 持仓数据列表，每个字典至少包含 'currency'、'dailyVolatility'.

    Returns:
        List[Dict[str, float]]: 形如 [{"currency": "USD/JPY", "upper": 1.05, "lower": 0.95}, ...].
    """
    if not data:
        return []

    analysis = []
    base_price = 1.0  # 演示基准价

    for item in data:
        vol = item.get("dailyVolatility", 0.0)
        upper = round(base_price + (vol * 0.05), 4)
        lower = round(base_price - (vol * 0.05), 4)
        analysis.append({
            "currency": item["currency"],
            "upper": upper,
            "lower": lower
        })

    return analysis

@tool
def generate_risk_level_list(data: List[Dict]) -> List[Dict[str, str]]:
    """
    生成风险等级列表（RiskLevelList）。
    根据每个货币的 valueAtRisk 进行判断：
    - VaR < 15000 → 低风险
    - 15000 <= VaR < 30000 → 中风险
    - VaR >= 30000 → 高风险

    Args:
        data (List[Dict]): 持仓数据，每个字典包含至少 'valueAtRisk'

    Returns:
        List[Dict[str, str]]: 形如 [{"level": "中风险"}, {"level": "低风险"}, ...]
    """
    result = []
    for d in data:
        var = d.get("valueAtRisk", 0)
        if var < 15000:
            level = "低风险"
        elif var < 30000:
            level = "中风险"
        else:
            level = "高风险"
        result.append({"level": level})
    return result
@tool
def generate_risk_tendency_list(data: List[Dict]) -> List[Dict[str, str]]:
    """
    生成风险变化趋势列表（RiskTendencyList）。
    根据每个货币的收益（benefit）进行判断：
    - benefit < 0 → 风险上升
    - benefit == 0 → 风险不变
    - benefit > 0 → 风险下降

    Args:
        data (List[Dict]): 持仓数据，每个字典包含至少 'benefit'

    Returns:
        List[Dict[str, str]]: 形如 [{"tendency": "上升"}, {"tendency": "下降"}, ...]
    """
    result = []
    for d in data:
        benefit = d.get("benefit", 0)
        if benefit < 0:
            tendency = "上升"
        elif benefit > 0:
            tendency = "下降"
        else:
            tendency = "不变"
        result.append({"tendency": tendency})
    return result

tools = [compute_single_currency_analysis, generate_risk_signal_analysis, generate_macro_risk_coefficients, compute_risk_transmission_path,
         compute_term_risk_distribution,compute_currency_exposure,generate_risk_level_list,generate_risk_tendency_list]

# 绑定工具
llm_with_tools = llm.bind_tools(tools)


# 大模型结点
def assistant(state: MessagesState):
    return {"messages": [llm_with_tools.invoke([sys_msg] + state["messages"])]}


# 实现react架构
builder = StateGraph(MessagesState)

builder.add_node("assistant", assistant)
builder.add_node("tools", ToolNode(tools))

builder.add_edge(START, "assistant")
builder.add_conditional_edges(
    "assistant",
    # If the latest message (result) from assistant is a tool call -> tools_condition routes to tools
    # If the latest message (result) from assistant is a not a tool call -> tools_condition routes to END
    tools_condition,
)
builder.add_edge("tools", "assistant")
react_graph = builder.compile()


# 输入持仓比例List 输出对冲策略Json
def Risk_strategy(input: list) -> dict:
    message = [HumanMessage(content=str(input))]
    result_raw = react_graph.invoke({"messages": message})
    prompt = PromptTemplate(
        template="你是一个自然语言解析成json格式的专家，你的任务是根据我的输入解析成json格式，\n输入{input}，\n{format_instructions}",
        input_variables=["input"],
        partial_variables={"format_instructions": parser.get_format_instructions()})
    # 给修复器使用
    prompt_value = prompt.format_prompt(input=result_raw['messages'][-1].content)
    chain = prompt | llm | parser
    try:
        result_json = chain.invoke({"input": result_raw['messages'][-1].content})
    except OutputParserException as e:
        print(e)
        # 如果解析错误的话 使用修复器 目前还用不到
        # raw_llm_output = (prompt | llm).invoke({"input": result_raw['messages'][-1].content})
        # from langchain.output_parsers import RetryOutputParser
        # retry_parser = RetryOutputParser.from_llm(parser=parser, llm=llm)
        # retry_parser.parse_with_prompt(raw_llm_output, prompt_value)
        raise (e)
    return result_json

