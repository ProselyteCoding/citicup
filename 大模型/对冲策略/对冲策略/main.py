from langchain_openai import ChatOpenAI
from langgraph.graph import MessagesState
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field
from typing import List, Optional
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from langchain.tools import tool
from langgraph.graph import START, StateGraph
from langgraph.prebuilt import tools_condition
from langgraph.prebuilt import ToolNode
from langchain_core.prompts import PromptTemplate
import os
#https://github.com/chatanywhere/GPT_API_free 免费领取
os.environ['OPENAI_API_KEY']='你的openai key'
os.environ['OPENAI_API_BASE']='https://api.chatanywhere.tech/v1'

#定义大语言模型 可以选择更好的 gpt-o1 模型 需要付费
#model_name="gpt-4o"
model_name="deepseek-r1"#太jb慢了 还容易报错
#model_name="o1-preview"
#model_name="o1"

llm = ChatOpenAI(model=model_name)


#定义输出
class CurrentHedgingAdvice(BaseModel):
    volatility: float = Field(description="市场波动率，数值型，范围0-1")
    emotion: str = Field(description="市场情绪，例如'偏多'（看涨）、'偏空'（看跌）、'中性'")
    suggestion: str = Field(description="对冲建议，简短的描述性文本")

class PositionRiskAssessment(BaseModel):
    risk: str = Field(description="风险等级，例如'高风险'、'中风险'、'低风险'")
    var: str = Field(description="风险价值（VaR），格式化为字符串，例如'$25,000'")
    suggestion: str = Field(description="风险管理建议，简短的描述性文本")

class CorrelationAnalysis(BaseModel):
    relative: str = Field(description="货币对相关性，例如'强正相关'、'弱负相关'、'无相关'")
    estimate: str = Field(description="对冲效果预估，例如'高'、'中等'、'低'")
    suggestion: str = Field(description="相关性对冲建议，例如建议选择负相关货币对进行对冲")

class CostBenefitAnalysis(BaseModel):
    cost: float = Field(description="对冲成本，数值型，范围0-1")
    influence: str = Field(description="对收益率的影响，例如'高'、'中'、'低'")
    suggestion: str = Field(description="成本收益对冲建议，例如'进行策略性对冲'")

class RecommendedPosition(BaseModel):
    currency: str = Field(description="建议持有的货币种类")
    quantity: int = Field(description="建议的持仓量")

class HedgingAdvice(BaseModel):
    historicalAnalysis: Optional[dict] = Field(default=None, description="历史分析，预留字段，目前未使用")
    currentHedgingAdvice: CurrentHedgingAdvice = Field(description="当前对冲建议，包括市场波动率、市场情绪和对冲策略")
    positionRiskAssessment: PositionRiskAssessment = Field(description="持仓风险评估，包括风险等级、VaR值和风险管理建议")
    correlationAnalysis: CorrelationAnalysis = Field(description="相关性分析，评估货币对之间的相关性及其对冲效果")
    costBenefitAnalysis: CostBenefitAnalysis = Field(description="成本效益分析，评估对冲成本及其对收益的影响")
    recommendedPositions: List[RecommendedPosition] = Field(description="建议持仓调整方案")

#定义输出解析器
parser = JsonOutputParser(pydantic_object=HedgingAdvice)
parser.get_format_instructions()

#定义prompt
prompt=f'''
你是一个专业的金融市场智能对冲分析助手，专注于外汇市场的风险管理和对冲策略优化。你的任务是根据用户提供的持仓数据，进行全面的对冲分析，并生成可操作的对冲建议。

你的分析应包含以下关键模块：

市场波动性分析

计算整体组合的日波动率
根据市场波动率判断市场情绪（例如“偏多”“中性”“偏空”）
头寸风险评估

计算持仓组合的 VaR（风险价值）
评估当前风险等级（高/中/低）
针对高风险头寸提供具体的对冲建议
相关性分析

评估不同货币对之间的相关性（强正相关、弱负相关、无相关等）
预测对冲效果（高/中等/低）
建议如何利用低相关或负相关资产进行对冲
成本效益分析

计算平均对冲成本并分析其对收益的影响
提供最佳的成本收益对冲策略
建议持仓调整

根据前述分析，提供具体的持仓调整建议
建议持仓量应优化风险敞口，同时控制对冲成本
输入格式
用户提供的持仓数据将以 JSON 数组格式输入，每个对象包含：

currency (str): 货币对名称 (如 "EUR/USD")
quantity (int): 持仓量
proportion (float): 持仓占比（系统计算得出）
benefit (float): 该持仓的盈亏
dailyVolatility (float): 该货币对的日波动率
valueAtRisk (str): VaR(95%)，格式化为美元字符串 (如 "$15,000")
beta (float): Beta 系数，衡量货币对的市场敏感度
hedgingCost (float): 该货币对的对冲成本
输出格式
你需要返回一个 JSON 对象
{parser.get_format_instructions()}
重要原则
准确性：所有计算必须基于输入数据，确保风险评估和建议的可靠性
简洁性：对冲建议应清晰明了，适合交易员快速执行
可操作性：提供的数据和建议应直接适用于实际交易决策
风险控制：优先减少高风险敞口，优化持仓结构
你的目标是帮助用户制定最优的外汇市场对冲策略，以最小成本实现最佳风险控制和收益平衡。
'''

#定义系统消息
sys_msg = SystemMessage(content=prompt)

#定义工具
@tool
def calculate_portfolio_volatility(data: List[Dict]) -> float:
    """
    计算整体持仓组合的波动率（Volatility）。
    
    该工具使用各货币对的日波动率（dailyVolatility）和其在持仓中的占比（proportion）计算加权平均波动率。

    Args:
        data (List[Dict]): 持仓数据列表，每个字典包含 'dailyVolatility' 和 'proportion' 两个字段。

    Returns:
        float: 计算出的组合波动率。
    """
    df = pd.DataFrame(data)
    return np.average(df["dailyVolatility"], weights=df["proportion"])

@tool
def determine_market_emotion(volatility: float) -> str:
    """
    根据组合波动率判断市场情绪。
    
    市场情绪由组合波动率决定：
    - 波动率 > 0.1 -> 市场情绪“偏多”（看涨趋势）
    - 波动率 < 0.05 -> 市场情绪“偏空”（看跌趋势）
    - 介于 0.05 和 0.1 之间 -> 市场情绪“中性”

    Args:
        volatility (float): 组合波动率。

    Returns:
        str: 市场情绪（'偏多'、'中性' 或 '偏空'）。
    """
    if volatility > 0.1:
        return "偏多"
    elif volatility < 0.05:
        return "偏空"
    return "中性"

@tool
def assess_risk(data: List[Dict]) -> Tuple[str, Dict]:
    """
    评估持仓组合的风险水平。
    
    该工具计算各货币对的 VaR（Value at Risk, 风险价值），并找出风险最大的货币对。
    根据 VaR 值评估整体风险等级：
    - VaR < 15000 -> 低风险
    - 15000 <= VaR < 30000 -> 中风险
    - VaR >= 30000 -> 高风险

    Args:
        data (List[Dict]): 持仓数据列表，每个字典包含 'valueAtRisk' 字段（字符串格式，如 '$15,000'）。

    Returns:
        Tuple[str, Dict]: (风险评级, VaR 最高的货币对数据)
    """
    df = pd.DataFrame(data)
    df["VaR_value"] = df["valueAtRisk"].replace({'$': '', ',': ''}, regex=True).astype(float)
    highest_risk = df.loc[df["VaR_value"].idxmax()].to_dict()
    risk_level = "低风险" if highest_risk["VaR_value"] < 15000 else "中风险" if highest_risk["VaR_value"] < 30000 else "高风险"
    return risk_level, highest_risk

@tool
def analyze_correlation(data: List[Dict]) -> Tuple[str, str]:
    """
    计算持仓货币对之间的相关性，并评估对冲有效性。

    该工具通过 Beta 系数计算货币对的相关性：
    - Beta 均值 > 1 -> 强正相关
    - Beta 均值 <= 1 -> 弱负相关

    同时，结合相关性信息，对对冲效果进行预估：
    - 相关性“弱负相关” -> 高对冲效果
    - 相关性“强正相关” -> 中等对冲效果

    Args:
        data (List[Dict]): 持仓数据列表，每个字典包含 'beta' 字段。

    Returns:
        Tuple[str, str]: (相关性类型, 对冲有效性)
    """
    df = pd.DataFrame(data)
    correlation = "强正相关" if df["beta"].mean() > 1 else "弱负相关"
    hedge_effectiveness = "高" if correlation == "弱负相关" else "中等"
    return correlation, hedge_effectiveness

@tool
def evaluate_hedging_cost(data: List[Dict]) -> Tuple[float, str]:
    """
    计算对冲成本，并评估其对收益率的影响。

    该工具计算所有持仓的平均对冲成本（hedgingCost），并给出成本影响评级：
    - 对冲成本 < 0.001 -> 低影响
    - 0.001 <= 对冲成本 < 0.002 -> 中等影响
    - 对冲成本 >= 0.002 -> 高影响

    Args:
        data (List[Dict]): 持仓数据列表，每个字典包含 'hedgingCost' 字段。

    Returns:
        Tuple[float, str]: (平均对冲成本, 成本影响评级)
    """
    df = pd.DataFrame(data)
    avg_cost = df["hedgingCost"].mean()
    cost_impact = "低" if avg_cost < 0.001 else "中" if avg_cost < 0.002 else "高"
    return avg_cost, cost_impact

tools=[calculate_portfolio_volatility,determine_market_emotion,assess_risk,analyze_correlation,evaluate_hedging_cost]

#绑定工具
llm_with_tools=llm.bind_tools(tools)

# 大模型结点
def assistant(state: MessagesState):
   return {"messages": [llm_with_tools.invoke([sys_msg] + state["messages"])]}

#实现react架构
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

#输入持仓比例List 输出对冲策略Json 
def Hedging_strategy(input:list)->dict:
    message=[HumanMessage(content=str(input))]
    result_raw=react_graph.invoke({"messages": message})
    prompt = PromptTemplate(
            template="你是一个自然语言解析成json格式的专家，你的任务是根据我的输入解析成json格式，\n输入{input}，\n{format_instructions}",
            input_variables=["input"],
            partial_variables={"format_instructions": parser.get_format_instructions()})
    #给修复器使用
    prompt_value = prompt.format_prompt(input=result_raw['messages'][-1].content)
    chain = prompt | llm | parser
    try:
        result_json = chain.invoke({"input": result_raw['messages'][-1].content})
    except OutputParserException as e:
        print(e)
        #如果解析错误的话 使用修复器 目前还用不到
        #raw_llm_output = (prompt | llm).invoke({"input": result_raw['messages'][-1].content})
        #from langchain.output_parsers import RetryOutputParser
        #retry_parser = RetryOutputParser.from_llm(parser=parser, llm=llm)
        #retry_parser.parse_with_prompt(raw_llm_output, prompt_value)
        raise(e)
    return result_json

if __name__=='__main__':
    #模拟数据
    input=[
  {
    "currency": "EUR/USD",
    "quantity": 1000000,
    "proportion": 0.35,
    "benefit": 2500,
    "dailyVolatility": 0.125,
    "valueAtRisk": "$15,000",
    "beta": 1.2,
    "hedgingCost": 0.0015
  },
  {
    "currency": "USD/JPY",
    "quantity": 2000000,
    "proportion": 0.45,
    "benefit": -1200,
    "dailyVolatility": 0.085,
    "valueAtRisk": "$25,000",
    "beta": 0.9,
    "hedgingCost": 0.0012
  },
  {
    "currency": "GBP/USD",
    "quantity": 1500000,
    "proportion": 0.25,
    "benefit": 3200,
    "dailyVolatility": 0.095,
    "valueAtRisk": "$18,000",
    "beta": 1.1,
    "hedgingCost": 0.0013
  },
  {
    "currency": "AUD/USD",
    "quantity": 1200000,
    "proportion": 0.2,
    "benefit": -500,
    "dailyVolatility": 0.075,
    "valueAtRisk": "$12,000",
    "beta": 0.85,
    "hedgingCost": 0.0011
  },
  {
    "currency": "USD/CAD",
    "quantity": 1800000,
    "proportion": 0.3,
    "benefit": 1500,
    "dailyVolatility": 0.082,
    "valueAtRisk": "$20,000",
    "beta": 0.95,
    "hedgingCost": 0.0014
  },
  {
    "currency": "NZD/USD",
    "quantity": 900000,
    "proportion": 0.15,
    "benefit": -200,
    "dailyVolatility": 0.065,
    "valueAtRisk": "$10,000",
    "beta": 0.75,
    "hedgingCost": 0.001
  },
  {
    "currency": "EUR/GBP",
    "quantity": 800000,
    "proportion": 0.1,
    "benefit": 1000,
    "dailyVolatility": 0.055,
    "valueAtRisk": "$8,000",
    "beta": 1.05,
    "hedgingCost": 0.0012
  },
  {
    "currency": "USD/CHF",
    "quantity": 1700000,
    "proportion": 0.28,
    "benefit": -2500,
    "dailyVolatility": 0.078,
    "valueAtRisk": "$22,000",
    "beta": 0.92,
    "hedgingCost": 0.0013
  },
  {
    "currency": "EUR/JPY",
    "quantity": 1300000,
    "proportion": 0.22,
    "benefit": 1800,
    "dailyVolatility": 0.088,
    "valueAtRisk": "$17,000",
    "beta": 1.15,
    "hedgingCost": 0.0015
  },
  {
    "currency": "GBP/JPY",
    "quantity": 1400000,
    "proportion": 0.24,
    "benefit": -600,
    "dailyVolatility": 0.092,
    "valueAtRisk": "$19,000",
    "beta": 1.1,
    "hedgingCost": 0.0016
  }
]

    print(Hedging_strategy(input))