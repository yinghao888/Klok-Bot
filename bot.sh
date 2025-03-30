#!/bin/bash

while true; do
    echo "正在检查现有的npm进程..."
    
    # 查找并杀死任何正在运行的npm进程
    pkill -f "npm start"
    
    # 确保在继续之前所有进程都已终止
    sleep 5  

    echo "正在启动npm..."
    npm start

    echo "进程已完成。等待12小时后重新启动..."
    
    # 等待12小时后重新启动
    sleep 43200  # 12小时（以秒为单位）
done
