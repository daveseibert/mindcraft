from typing import Optional, Any

from pydantic import BaseModel
import json
import os
import streamlit as st
import subprocess
import requests

st.set_page_config(page_title="Task Runner", layout="wide")

task_path = "tasks/tasks.json"
# if not os.path.isabs(task_path):
#     task_path = os.path.abspath(task_path)

cmd = ["python", "tasks/evals.py", "--task_path", task_path, "--insecure_coding", "--no_launch_world"]
# project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

st.code(cmd, language="bash")

if st.button("Run"):
    st.write(f"Running...")


    # Execute the command from the project root directory
    try:
        process = subprocess.run(cmd, check=True, env=os.environ.copy())
        st.write(f"Return code: `{process.returncode}`")
    except subprocess.CalledProcessError as e:
        st.error(e)

class CompletionRequest(BaseModel):
    model: Optional[str] = "gpt-4o-mini"
    messages: list

class ResponseRequest(BaseModel):
    model: Optional[str] = "gpt-4o-mini"
    input: list

class EmbeddingsRequest(BaseModel):
    model: Optional[str] = "text-embedding-3-small"
    input: str | list

def check_health(url):
    try:
        status = requests.get(f"{url}/health").status_code
    except requests.exceptions.ConnectionError as e:
        status = -1
        st.error(e)
    return status

def embed(url, body: BaseModel):
    try:
        target = f"{url}/embeddings"
        st.code(target)
        response = requests.post(target, data=body.model_dump_json())
        status = response.status_code
        body = response.json()
        data = body[0]['embedding']
    except requests.exceptions.ConnectionError as e:
        status = -1
        data = None
        st.error(e)
    except requests.exceptions.JSONDecodeError as e:
        data = None
        st.error(e)
    return status, data


def post(url, endpoint, body: BaseModel):
    try:
        target = f"{url}/{endpoint}"
        st.code(target)
        response = requests.post(target, data=body.model_dump_json())
        status = response.status_code
        data = response.json()
    except requests.exceptions.ConnectionError as e:
        status = -1
        data = None
        st.error(e)
    except requests.exceptions.JSONDecodeError as e:
        data = None
        st.error(e)
    return status, data


FASTAPI = "http://fastapi"
BUN = "http://bun"

MESSAGES = [{"role": "user", "content": "hello"}]

col1, col2 = st.columns(2)

with col1:
    fastapi_health_status = check_health(FASTAPI)
    st.write(f"FastAPI status: **{fastapi_health_status}**")
    bun_health_status = check_health(BUN)
    st.write(f"Bun status: **{bun_health_status}**")

    fastapi_completion_status, fastapi_completion_data = post(FASTAPI, "completions", CompletionRequest(messages=MESSAGES))
    st.write(fastapi_completion_status)
    st.write(fastapi_completion_data)

    bun_completion_status, bun_completion_data = post(BUN, "completions", CompletionRequest(messages=MESSAGES))
    st.write(bun_completion_status)
    st.write(bun_completion_data)

    bun_responses_status, bun_responses_data = post(BUN, "responses", ResponseRequest(input=MESSAGES))
    st.write(bun_responses_status)
    st.write(bun_responses_data)

with col2:
    fastapi_embedding_status, fastapi_embedding_data = embed(FASTAPI, EmbeddingsRequest(input="Hello"))
    st.write(fastapi_embedding_status)
    st.write(len(fastapi_embedding_data))
    bun_embedding_status, bun_embedding_data = embed(BUN, EmbeddingsRequest(input="Hello"))
    st.write(bun_embedding_status)
    st.write(len(bun_embedding_data))
