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
# model_name="deepseek-r1"
# model_name="o1-preview"
# model_name="o1"
model_name = "gpt-4o-mini"
# model_name="gpt-3.5-turbo"
llm = ChatOpenAI(model=model_name)


class ScenarioAnalysisInput(BaseModel):
    scenario: str = Field(description="需要分析的货币对")


class ScenarioAnalysisOutput(BaseModel):
    upper: float = Field(description="预测上限")
    lower: float = Field(description="预测下限")


# 定义输出解析器
parser = JsonOutputParser(pydantic_object=ScenarioAnalysisOutput)
format_instructions = parser.get_format_instructions()

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
        "scenario": "EUR/USD"
    }

    print(f"输入情景: {test_case}")
    try:
        result = scenario_analyzer(test_case)
        print(f"分析结果: {result}\n{'-' * 50}")
    except Exception as e:
        print(f"分析失败: {str(e)}\n{'-' * 50}")