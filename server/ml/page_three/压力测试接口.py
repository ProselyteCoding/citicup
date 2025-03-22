from langchain_openai import ChatOpenAI
from langgraph.graph import MessagesState
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException
from langgraph.graph import START, StateGraph
from langchain.prompts import PromptTemplate
import os
#https://github.com/chatanywhere/GPT_API_free 免费领取
#免费版支持gpt-4o一天5次；支持deepseek-r1, deepseek-v3一天30次，支持gpt-4o-mini，gpt-3.5-turbo一天200次。
# 设置API密钥和端点
os.environ['OPENAI_API_KEY'] = 'sk-GQLASa7Vc1lY6NC9pw9X0OMpuct3i6eJz3CcHKfqAvwp5Xws'#我的api，别用太多
os.environ['OPENAI_API_BASE'] = 'https://api.chatanywhere.tech/v1'

# 定义模型
# model_name = "gpt-4o"
# model_name="deepseek-r1"
# model_name="o1-preview"
# model_name="o1"
model_name = "gpt-4o-mini"
# model_name="gpt-3.5-turbo"
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
format_instructions = parser.get_format_instructions()

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


def scenario_analyzer(input_dict: dict) -> dict:
    input_model = ScenarioAnalysisInput(**input_dict)
    message = [HumanMessage(content=input_model.model_dump_json())]

    result_raw = react_graph.invoke({"messages": message})

    try:
        output = parser.parse(result_raw['messages'][-1].content)
        
        # 确保 money 是数字
        if isinstance(output, dict) and 'money' in output:
            # 如果 money 是字符串，转换为浮点数
            if isinstance(output['money'], str):
                # 移除 $ 符号和逗号
                cleaned_money = output['money'].replace('$', '').replace(',', '')
                try:
                    output['money'] = float(cleaned_money)
                except ValueError:
                    output['money'] = 0.0
        
        # 兼容不同的情况
        if isinstance(output, dict):
            output = ScenarioAnalysisOutput(**output)  # 转换回 Pydantic 对象
        
        return output.model_dump()  # Pydantic v2 兼容
    except OutputParserException as e:
        print(f"解析错误: {e}")
        raise


if __name__ == '__main__':
    test_case = {
        "scenario": "美联储加息100bp",
        "positions": [
            {
                "currency": "EUR/USD",
                "quantity": 1000000,
                "proportion": 0.172,
                "benefit": 2500,
                "dailyVolatility": 0.125,
                "valueAtRisk": "15000",
                "beta": 1.2,
                "hedgingCost": 0.0015
            },
            {
                "currency": "GBP/USD",
                "quantity": 800000,
                "proportion": 0.138,
                "benefit": 1800,
                "dailyVolatility": 0.112,
                "valueAtRisk": "12000",
                "beta": 1.1,
                "hedgingCost": 0.0018
            },
            {
                "currency": "USD/JPY",
                "quantity": 2000000,
                "proportion": 0.345,
                "benefit": -1200,
                "dailyVolatility": 0.085,
                "valueAtRisk": "25000",
                "beta": 0.9,
                "hedgingCost": 0.0012
            },
            {
                "currency": "USD/CHF",
                "quantity": 500000,
                "proportion": 0.086,
                "benefit": 950,
                "dailyVolatility": 0.078,
                "valueAtRisk": "8000",
                "beta": 0.8,
                "hedgingCost": 0.0014
            },
            {
                "currency": "AUD/USD",
                "quantity": 1500000,
                "proportion": 0.259,
                "benefit": -800,
                "dailyVolatility": 0.132,
                "valueAtRisk": "18000",
                "beta": 1.3,
                "hedgingCost": 0.0016
            }
        ]

    }

    print(f"输入情景: {test_case}")
    try:
        result = scenario_analyzer(test_case)
        print(f"分析结果: {result}\n{'-' * 50}")
    except Exception as e:
        print(f"分析失败: {str(e)}\n{'-' * 50}")                           