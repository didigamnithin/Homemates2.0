#!/usr/bin/env python3
"""
Homemates AI - Startup Script
Automates the process of installing dependencies and starting the application
"""

import os
import sys
import subprocess
import threading
import time
from pathlib import Path

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_colored(message, color=Colors.RESET):
    """Print colored message"""
    print(f"{color}{message}{Colors.RESET}")

def print_step(step_num, message):
    """Print step message"""
    print_colored(f"\n{'='*60}", Colors.CYAN)
    print_colored(f"Step {step_num}: {message}", Colors.BOLD + Colors.CYAN)
    print_colored(f"{'='*60}", Colors.CYAN)

def check_node_installed():
    """Check if Node.js is installed"""
    print_colored("\n🔍 Checking Node.js installation...", Colors.YELLOW)
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print_colored(f"✅ Node.js is installed: {result.stdout.strip()}", Colors.GREEN)
            return True
    except FileNotFoundError:
        pass
    
    print_colored("❌ Node.js is not installed. Please install Node.js 18+ first.", Colors.RED)
    print_colored("Visit: https://nodejs.org/", Colors.YELLOW)
    return False

def check_npm_installed():
    """Check if npm is installed"""
    print_colored("🔍 Checking npm installation...", Colors.YELLOW)
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print_colored(f"✅ npm is installed: {result.stdout.strip()}", Colors.GREEN)
            return True
    except FileNotFoundError:
        pass
    
    print_colored("❌ npm is not installed.", Colors.RED)
    return False

def check_ngrok_installed():
    """Check if ngrok is installed"""
    print_colored("\n🔍 Checking ngrok installation...", Colors.YELLOW)
    try:
        result = subprocess.run(['ngrok', 'version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip().split('\n')[0] if result.stdout else "installed"
            print_colored(f"✅ ngrok is installed: {version}", Colors.GREEN)
            return True
    except FileNotFoundError:
        pass
    
    print_colored("⚠️  ngrok is not installed.", Colors.YELLOW)
    print_colored("   ngrok is optional but recommended for webhook testing.", Colors.YELLOW)
    print_colored("   Install it with: brew install ngrok (macOS) or download from ngrok.com", Colors.YELLOW)
    return False

def run_ngrok(port=3001):
    """Run ngrok to expose local server"""
    print_colored("\n🌐 Starting ngrok tunnel...", Colors.CYAN)
    print_colored(f"   Exposing local port {port} to the internet", Colors.CYAN)
    
    process = subprocess.Popen(
        ['ngrok', 'http', str(port)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True,
        bufsize=1
    )
    
    # Give ngrok a moment to start
    time.sleep(2)
    
    # Try to get the ngrok URL from the API
    try:
        import urllib.request
        import json
        response = urllib.request.urlopen('http://127.0.0.1:4040/api/tunnels', timeout=2)
        data = json.loads(response.read().decode())
        if data.get('tunnels'):
            public_url = data['tunnels'][0].get('public_url', '')
            if public_url:
                print_colored(f"\n✅ ngrok tunnel is active!", Colors.GREEN)
                print_colored(f"   Public URL: {public_url}", Colors.BOLD + Colors.CYAN)
                print_colored(f"   Webhook URL: {public_url}/api/webhooks/elevenlabs", Colors.BOLD + Colors.CYAN)
                print_colored(f"\n   ⚠️  Configure this webhook URL in your ElevenLabs dashboard!", Colors.YELLOW)
                return process, public_url
    except Exception:
        pass
    
    print_colored("   ngrok is starting...", Colors.YELLOW)
    print_colored("   Check http://127.0.0.1:4040 for the ngrok dashboard", Colors.CYAN)
    print_colored("   Copy the HTTPS URL and configure it in ElevenLabs dashboard", Colors.YELLOW)
    
    return process, None

def run_command(command, cwd=None, shell=False):
    """Run a shell command and return the result"""
    try:
        if shell:
            process = subprocess.Popen(
                command,
                shell=True,
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
        else:
            process = subprocess.Popen(
                command,
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
        
        # Print output in real-time
        for line in process.stdout:
            print(line.rstrip())
        
        process.wait()
        return process.returncode == 0
    except Exception as e:
        print_colored(f"❌ Error running command: {e}", Colors.RED)
        return False

def install_backend_dependencies():
    """Install backend dependencies"""
    print_step(1, "Installing Backend Dependencies")
    
    backend_dir = Path(__file__).parent / "backend"
    if not backend_dir.exists():
        print_colored("❌ Backend directory not found!", Colors.RED)
        return False
    
    print_colored(f"📦 Installing dependencies in {backend_dir}...", Colors.YELLOW)
    success = run_command(['npm', 'install'], cwd=str(backend_dir))
    
    if success:
        print_colored("✅ Backend dependencies installed successfully!", Colors.GREEN)
    else:
        print_colored("❌ Failed to install backend dependencies", Colors.RED)
    
    return success

def install_frontend_dependencies():
    """Install frontend dependencies"""
    print_step(2, "Installing Frontend Dependencies")
    
    frontend_dir = Path(__file__).parent / "frontend"
    if not frontend_dir.exists():
        print_colored("❌ Frontend directory not found!", Colors.RED)
        return False
    
    print_colored(f"📦 Installing dependencies in {frontend_dir}...", Colors.YELLOW)
    success = run_command(['npm', 'install'], cwd=str(frontend_dir))
    
    if success:
        print_colored("✅ Frontend dependencies installed successfully!", Colors.GREEN)
    else:
        print_colored("❌ Failed to install frontend dependencies", Colors.RED)
    
    return success

def check_env_files():
    """Check if environment files exist (do not create or modify them)"""
    print_step(3, "Checking Environment Files")
    
    backend_env = Path(__file__).parent / "backend" / ".env"
    frontend_env = Path(__file__).parent / "frontend" / ".env.local"
    
    all_exist = True
    
    if not backend_env.exists():
        print_colored("⚠️  Backend .env file not found!", Colors.YELLOW)
        print_colored("   Please create backend/.env with required environment variables", Colors.YELLOW)
        all_exist = False
    else:
        print_colored("✅ Backend .env file exists", Colors.GREEN)
    
    if not frontend_env.exists():
        print_colored("⚠️  Frontend .env.local file not found!", Colors.YELLOW)
        print_colored("   Please create frontend/.env.local with NEXT_PUBLIC_API_URL", Colors.YELLOW)
        all_exist = False
    else:
        print_colored("✅ Frontend .env.local file exists", Colors.GREEN)
    
    if not all_exist:
        print_colored("\n⚠️  Some environment files are missing.", Colors.YELLOW)
        print_colored("   The app may not work correctly without them.", Colors.YELLOW)
        print_colored("   Please create the missing files before continuing.", Colors.YELLOW)
        response = input("\nContinue anyway? (y/n): ").lower()
        if response != 'y':
            return False
    
    return True

def print_output(process, prefix, color):
    """Print output from a process"""
    try:
        for line in iter(process.stdout.readline, ''):
            if line:
                print_colored(f"[{prefix}] {line.rstrip()}", color)
    except Exception:
        pass

def run_backend():
    """Run the backend server"""
    backend_dir = Path(__file__).parent / "backend"
    print_colored("\n🚀 Starting Backend Server...", Colors.BLUE)
    print_colored(f"   Backend will run on http://localhost:3001", Colors.CYAN)
    
    # Run in a way that shows output
    process = subprocess.Popen(
        ['npm', 'run', 'dev'],
        cwd=str(backend_dir),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )
    
    return process

def run_frontend():
    """Run the frontend server"""
    frontend_dir = Path(__file__).parent / "frontend"
    print_colored("\n🚀 Starting Frontend Server...", Colors.GREEN)
    print_colored(f"   Frontend will run on http://localhost:3000", Colors.CYAN)
    
    # Run in a way that shows output
    process = subprocess.Popen(
        ['npm', 'run', 'dev'],
        cwd=str(frontend_dir),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )
    
    return process

def main():
    """Main function"""
    print_colored("\n" + "="*60, Colors.BOLD + Colors.CYAN)
    print_colored("  Homemates AI - Startup Script", Colors.BOLD + Colors.CYAN)
    print_colored("="*60, Colors.BOLD + Colors.CYAN)
    
    # Check prerequisites
    if not check_node_installed():
        sys.exit(1)
    
    if not check_npm_installed():
        sys.exit(1)
    
    # Install dependencies
    if not install_backend_dependencies():
        print_colored("\n❌ Failed to install backend dependencies. Exiting.", Colors.RED)
        sys.exit(1)
    
    if not install_frontend_dependencies():
        print_colored("\n❌ Failed to install frontend dependencies. Exiting.", Colors.RED)
        sys.exit(1)
    
    # Check environment files
    if not check_env_files():
        print_colored("\n❌ Environment files check failed. Exiting.", Colors.RED)
        sys.exit(1)
    
    # Check ngrok and ask if user wants to use it
    ngrok_installed = check_ngrok_installed()
    use_ngrok = False
    ngrok_process = None
    ngrok_url = None
    
    if ngrok_installed:
        print_colored("\n❓ Do you want to use ngrok for webhook testing?", Colors.CYAN)
        print_colored("   This will expose your local backend to the internet for ElevenLabs webhooks.", Colors.YELLOW)
        response = input("   Use ngrok? (y/n, default: n): ").lower()
        use_ngrok = response == 'y'
    
    # Start servers
    print_step(4, "Starting Application Servers")
    
    print_colored("\n🎯 Starting both backend and frontend servers...", Colors.BOLD)
    print_colored("   Press Ctrl+C to stop both servers\n", Colors.YELLOW)
    
    try:
        # Start backend
        backend_process = run_backend()
        
        # Start frontend
        frontend_process = run_frontend()
        
        # Start threads to print output from both processes
        backend_thread = threading.Thread(
            target=print_output,
            args=(backend_process, 'BACKEND', Colors.BLUE),
            daemon=True
        )
        frontend_thread = threading.Thread(
            target=print_output,
            args=(frontend_process, 'FRONTEND', Colors.GREEN),
            daemon=True
        )
        
        backend_thread.start()
        frontend_thread.start()
        
        # Start ngrok if requested
        if use_ngrok:
            time.sleep(2)  # Give backend a moment to start
            ngrok_process, ngrok_url = run_ngrok(3001)
        
        # Give servers a moment to start
        time.sleep(3)
        
        print_colored("\n" + "="*60, Colors.GREEN)
        print_colored("✅ Application is running!", Colors.BOLD + Colors.GREEN)
        print_colored("="*60, Colors.GREEN)
        print_colored("\n📍 Access the application at:", Colors.BOLD)
        print_colored("   Frontend: http://localhost:3000", Colors.CYAN)
        print_colored("   Backend:  http://localhost:3001", Colors.CYAN)
        if ngrok_url:
            print_colored(f"   ngrok URL: {ngrok_url}", Colors.CYAN)
            print_colored(f"   Webhook URL: {ngrok_url}/api/webhooks/elevenlabs", Colors.CYAN)
        print_colored("\n⚠️  Press Ctrl+C to stop all servers\n", Colors.YELLOW)
        
        # Wait for all processes
        try:
            while backend_process.poll() is None and frontend_process.poll() is None:
                time.sleep(1)
        except KeyboardInterrupt:
            print_colored("\n\n🛑 Stopping servers...", Colors.YELLOW)
            backend_process.terminate()
            frontend_process.terminate()
            if ngrok_process:
                ngrok_process.terminate()
            backend_process.wait()
            frontend_process.wait()
            if ngrok_process:
                ngrok_process.wait()
            print_colored("✅ All servers stopped successfully", Colors.GREEN)
    
    except KeyboardInterrupt:
        print_colored("\n\n🛑 Interrupted by user", Colors.YELLOW)
        if 'backend_process' in locals():
            backend_process.terminate()
        if 'frontend_process' in locals():
            frontend_process.terminate()
        if 'ngrok_process' in locals() and ngrok_process:
            ngrok_process.terminate()
        sys.exit(0)
    except Exception as e:
        print_colored(f"\n❌ Error starting servers: {e}", Colors.RED)
        sys.exit(1)

if __name__ == "__main__":
    main()

