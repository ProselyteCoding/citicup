import logging
import sys
import os

# 添加大模型目录到路径
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.join(os.path.dirname(current_dir), 'ml')
sys.path.append(ml_dir)

# 导入大模型模块
try:
    from ml.page_three.风险信号分析 import scenario_analyzer as analyze_risk_signals
    from ml.page_three.压力测试接口 import scenario_analyzer as perform_stress_test
except ImportError as e:
    print(f"导入大模型模块失败: {e}")

def format_model_output(raw_output):
    """
    将大模型的原始输出格式化为前端所需格式
    Args:
        raw_output: 大模型原始输出
    Returns:
        格式化后的数据
    """
    # 根据实际大模型输出格式编写转换逻辑
    # 这里是一个示例实现
    formatted_output = {
        "historicalAnalysis": None,
        "currentHedgingAdvice": {},
        "positionRiskAssessment": {},
        "correlationAnalysis": {},
        "costBenefitAnalysis": {},
        "recommendedPositions": []
    }
    
    # 提取volatility和emotion等信息
    if isinstance(raw_output, dict):
        # 处理市场波动信息
        if "market_volatility" in raw_output:
            formatted_output["currentHedgingAdvice"]["volatility"] = raw_output.get("market_volatility", 0.125)
        if "market_sentiment" in raw_output:
            formatted_output["currentHedgingAdvice"]["emotion"] = raw_output.get("market_sentiment", "偏多")
        if "hedging_advice" in raw_output:
            formatted_output["currentHedgingAdvice"]["suggestion"] = raw_output.get("hedging_advice", "减少EUR敞口")
            
        # 处理风险评估
        if "risk_level" in raw_output:
            formatted_output["positionRiskAssessment"]["risk"] = raw_output.get("risk_level", "高风险")
        if "var_value" in raw_output:
            formatted_output["positionRiskAssessment"]["var"] = raw_output.get("var_value", "$25,000")
        if "risk_advice" in raw_output:
            formatted_output["positionRiskAssessment"]["suggestion"] = raw_output.get("risk_advice", "减少EUR敞口")
            
        # 处理相关性分析
        if "correlation" in raw_output:
            formatted_output["correlationAnalysis"]["relative"] = raw_output.get("correlation", "强正相关")
        if "hedge_effectiveness" in raw_output:
            formatted_output["correlationAnalysis"]["estimate"] = raw_output.get("hedge_effectiveness", "中等")
        if "correlation_advice" in raw_output:
            formatted_output["correlationAnalysis"]["suggestion"] = raw_output.get("correlation_advice", "选择负相关货币对进行对冲")
            
        # 处理成本效益分析
        if "hedge_cost" in raw_output:
            formatted_output["costBenefitAnalysis"]["cost"] = raw_output.get("hedge_cost", 0.0015)
        if "return_impact" in raw_output:
            formatted_output["costBenefitAnalysis"]["influence"] = raw_output.get("return_impact", "低")
        if "cost_advice" in raw_output:
            formatted_output["costBenefitAnalysis"]["suggestion"] = raw_output.get("cost_advice", "进行策略性对冲")
            
        # 处理建议持仓
        if "recommended_positions" in raw_output and isinstance(raw_output["recommended_positions"], list):
            formatted_output["recommendedPositions"] = raw_output["recommended_positions"]
    
    # 确保所有必要字段都有默认值
    if "volatility" not in formatted_output["currentHedgingAdvice"]:
        formatted_output["currentHedgingAdvice"]["volatility"] = 0.125
    if "emotion" not in formatted_output["currentHedgingAdvice"]:
        formatted_output["currentHedgingAdvice"]["emotion"] = "偏多"
    if "suggestion" not in formatted_output["currentHedgingAdvice"]:
        formatted_output["currentHedgingAdvice"]["suggestion"] = "减少EUR敞口"
        
    # 其他字段的默认值处理...
    
    return formatted_output

def format_stress_test_output(raw_output, scenario):
    """
    将大模型的压力测试原始输出格式化为前端所需格式
    Args:
        raw_output: 大模型原始输出
        scenario: 原始情景描述
    Returns:
        格式化后的数据
    """
    # 根据实际大模型输出格式编写转换逻辑
    formatted_output = {
        "scenario": scenario,
        "influence": "中",
        "probability": 0.05,
        "suggestion": "保持当前持仓"
    }
    
    # 提取相关信息
    if isinstance(raw_output, dict):
        if "impact" in raw_output:
            formatted_output["influence"] = raw_output.get("impact", "中")
        if "probability" in raw_output:
            formatted_output["probability"] = raw_output.get("probability", 0.05)
        if "recommendation" in raw_output:
            formatted_output["suggestion"] = raw_output.get("recommendation", "保持当前持仓")
    
    return formatted_output

# 修改对冲建议接口函数
async def get_hedging_advice(portfolio_data):
    """
    从大模型获取对冲建议
    Args:
        portfolio_data: 持仓数据
    Returns:
        对冲建议数据
    """
    try:
        # 首先尝试使用大模型
        try:
            # 调用大模型模块中的分析函数
            # 注意：直接传递portfolio_data，而不是包装为字典
            # 因为我们已在adapter中处理了这种情况
            result = analyze_risk_signals(portfolio_data)
            return result
                
        except Exception as model_error:
            print(f"调用大模型失败，使用备用方案: {model_error}")
            # 备用方案: 使用原有模拟数据
            return {
                "historicalAnalysis": None,
                "currentHedgingAdvice": {
                    "volatility": 0.125,
                    "emotion": "偏多",
                    "suggestion": "减少EUR敞口",
                },
                # 其余代码不变...
            }
    except Exception as error:
        print(f"获取对冲建议出错: {error}")
        raise error

# 修改压力测试接口函数
async def get_stress_test_result(scenario):
    """
    从大模型获取压力测试结果
    Args:
        scenario: 压力测试情景
    Returns:
        压力测试结果
    """
    try:
        # 首先尝试使用大模型
        try:
            # 调用大模型模块中的压力测试函数
            # 注意：直接传递scenario字符串，而不是包装为字典
            # 因为我们已在adapter中处理了这种情况
            result = perform_stress_test(scenario)
            return result
                
        except Exception as model_error:
            print(f"调用大模型失败，使用备用方案: {model_error}")
            # 备用方案: 使用原有模拟数据
            return {
                "scenario": scenario,
                "influence": "高",
                "probability": 0.01,
                "suggestion": "减少EUR敞口",
            }
    except Exception as error:
        print(f"获取压力测试结果出错: {error}")
        raise error



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
