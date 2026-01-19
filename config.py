"""
Configuration file for paths and directories
Update these paths to match your system setup
"""

import os
from pathlib import Path

# Python executable path
PYTHON_EXE = r"C:\Users\HP\AppData\Local\Programs\Python\Python314\python.exe"

# ODA File Converter path
ODA_PATH = r"C:\Program Files\ODA\ODAFileConverter 26.10.0\ODAFileConverter.exe"

# Base directory (project root)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Converted files directory (for DXF output)
# Note: Do NOT use ".." - that would go to parent directory
CONVERTED_DIR = os.path.abspath(os.path.join(BASE_DIR, "converted"))

# Node.js executable (default: "node" - assumes it's in PATH)
NODE_EXE = "node"

# Ensure converted directory exists
os.makedirs(CONVERTED_DIR, exist_ok=True)

