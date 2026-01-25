To setup the leap library, run the following:

Linux config
1. wget -qO - https://repo.ultraleap.com/keys/apt/gpg | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/ultraleap.gpg
2. echo 'deb [arch=amd64] https://repo.ultraleap.com/apt stable main' | sudo tee /etc/apt/sources.list.d/ultraleap.list
3. sudo apt update
4. sudo apt install ultraleap-hand-tracking ##This part requires 

git clone https://github.com/ultraleap/leapc-python-bindings.git
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -e leapc-python-api
export LEAPSDK_INSTALL_LOCATION="/usr/lib/ultraleap-hand-tracking-service"
export LEAPSDK_INSTALL_LOCATION="/usr/include"
cp /usr/include/LeapC.h /usr/lib/ultraleap-hand-tracking-service/

python -m build leapc-cffi