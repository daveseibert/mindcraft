import os
import json
import argparse
import subprocess
import time
import logfire

logfire.configure(service_name="task_runner")

def run_task(task_path, task_id, profiles=None):
    """Run a single task using main.js"""
    # Convert task_path to absolute path if it's relative
    if not os.path.isabs(task_path):
        task_path = os.path.abspath(task_path)

    cmd = ["node", "main.js", "--task_path", task_path, "--task_id", task_id]

    # Add profiles if provided
    if profiles:
        cmd.extend(["--profiles", *profiles])

    print(f"Running task: {task_id}")

    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Execute the command from the project root directory
    try:
        process = subprocess.run(cmd, check=True, cwd=project_root)
        return process.returncode == 0
    except subprocess.CalledProcessError as e:
        print(e)
        return False


def main():
    task_path = "tasks/tasks.json"
    profiles = [
        "profiles/tasks/crafting_profile.json",
        ]
    delay = 1

    with open(task_path, 'r') as f:
        tasks = json.load(f)

    print(f"Found {len(tasks)} tasks in {task_path}")

    # Run each task sequentially
    successful_tasks = 0
    for task_id in tasks:
        success = run_task(task_path, task_id, profiles)
        if success:
            successful_tasks += 1

        # Wait between tasks
        time.sleep(delay)

    print(f"Completed {successful_tasks}/{len(tasks)} tasks successfully")

if __name__ == "__main__":
    main()

