import os
import streamlit as st
import subprocess

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
