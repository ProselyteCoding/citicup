from langchain_openai import ChatOpenAI
from langgraph.graph import MessagesState
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException
from langgraph.graph import START, StateGraph
from langchain.prompts import PromptTemplate
import os

# 设置API密钥和端点
os.environ['OPENAI_API_KEY'] = 'sk-GQLASa7Vc1lY6NC9pw9X0OMpuct3i6eJz3CcHKfqAvwp5Xws'
os.environ['OPENAI_API_BASE'] = 'https://api.chatanywhere.tech/v1'

# 定义模型
# model_name = "gpt-4o"
# model_name="deepseek-r1"#太jb慢了 还容易报错
# model_name="o1-preview"
# model_name="o1"
model_name = "gpt-4o-mini"
# model_name="gpt-3.5-turbo"
llm = ChatOpenAI(model=model_name)


# "riskSignalAnalysis": {
#   "current": {
#     "credit": 80,            // 信用风险
#     "policy": 20,            // 政策风险
#     "market": 10,            // 市场流动性
#     "politician": 30,        // 政治风险
#     "economy": 40            // 经济风险
#   },
#   "warning": {               // 预警阈值
#     "credit": 80,
#     "policy": 20,
#     "market": 10,
#     "politician": 30,
#     "economy": 40
#   }
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
format_instructions = parser.get_format_instructions()

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


def scenario_analyzer(input_dict: dict) -> dict:
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

    try:
        result = scenario_analyzer(test_case)
        print(f"分析结果: {result}\n{'-' * 50}")
    except Exception as e:
        print(f"分析失败: {str(e)}\n{'-' * 50}")