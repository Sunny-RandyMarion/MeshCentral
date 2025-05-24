/**
* @description MeshCentral task manager
* @author Ylian Saint-Hilaire
* @copyright Intel Corporation 2018-2022
* @license Apache-2.0
* @version v0.0.1
*/

/*jslint node: true */
/*jshint node: true */
/*jshint strict:false */
/*jshint -W097 */
/*jshint esversion: 6 */
'use strict';

module.exports.createTaskManager = function (parent) {
    var obj = {};
    obj.parent = parent;
    obj.agentTasks = {}; // Dictionary of agent node IDs with their respective tasks
    obj.nextTaskId = 1;

    // Add a new task for an agent
    // taskType: Type of task to execute
    // nodeId: Target node identifier
    // taskData: Data needed for the task
    // options: Additional task options
    obj.addTask = function (taskType, nodeId, taskData, options) {
        if (typeof taskType !== 'string' || !nodeId) return null;
        
        const taskId = obj.nextTaskId++;
        const task = {
            id: taskId,
            type: taskType,
            nodeId: nodeId,
            data: taskData || {},
            status: 'pending', // pending, sent, complete, failed
            options: options || {},
            addTime: Date.now()
        };
        
        // Initialize agent's task list if not exists
        if (!obj.agentTasks[nodeId]) {
            obj.agentTasks[nodeId] = [];
        }
        
        // Add task to the queue
        obj.agentTasks[nodeId].push(task);
        
        // Try to dispatch the task if agent is currently connected
        obj.dispatchTasks(nodeId);
        
        return taskId;
    };

    // Get the status of a specific task
    obj.getTaskStatus = function (nodeId, taskId) {
        if (!nodeId || !obj.agentTasks[nodeId]) return null;
        
        const tasks = obj.agentTasks[nodeId];
        for (let i = 0; i < tasks.length; i++) {
            if (tasks[i].id === taskId) {
                return {
                    id: tasks[i].id,
                    type: tasks[i].type,
                    status: tasks[i].status,
                    addTime: tasks[i].addTime,
                    result: tasks[i].result
                };
            }
        }
        
        return null;
    };

    // Cancel a pending task
    obj.cancelTask = function (nodeId, taskId) {
        if (!nodeId || !obj.agentTasks[nodeId]) return false;
        
        const tasks = obj.agentTasks[nodeId];
        for (let i = 0; i < tasks.length; i++) {
            if (tasks[i].id === taskId && tasks[i].status === 'pending') {
                tasks[i].status = 'cancelled';
                // Remove the task if cancelled
                obj.agentTasks[nodeId].splice(i, 1);
                return true;
            }
        }
        
        return false;
    };

    // Try to dispatch pending tasks to an agent
    obj.dispatchTasks = function (nodeId) {
        if (!nodeId || !obj.agentTasks[nodeId]) return;
        
        // Find the agent connection
        const agent = parent.webserver.wssAgents.getAgent(nodeId);
        if (!agent || agent.authenticated !== 2) return; // Agent not connected or not authenticated
        
        const tasks = obj.agentTasks[nodeId];
        const pendingTasks = tasks.filter(task => task.status === 'pending');
        
        // Dispatch pending tasks
        for (let i = 0; i < pendingTasks.length; i++) {
            const task = pendingTasks[i];
            
            // Send the task to the agent
            try {
                const cmd = {
                    action: 'script-task',
                    taskid: task.id,
                    type: task.type,
                    data: task.data
                };
                
                agent.send(JSON.stringify(cmd));
                task.status = 'sent';
                task.sentTime = Date.now();
                
                // Add timeout if specified in options
                if (task.options.timeout) {
                    task.timeoutTimer = setTimeout(() => {
                        if (task.status === 'sent') {
                            task.status = 'failed';
                            task.result = { error: 'Task timed out' };
                        }
                    }, task.options.timeout);
                }
            } catch (ex) {
                // Failed to send the task
                task.status = 'failed';
                task.result = { error: 'Failed to send task to agent: ' + ex.toString() };
            }
        }
    };

    // Handle agent action (response from the agent)
    obj.agentAction = function (command, agent) {
        if (!command || !command.taskid || !agent || !agent.dbNodeKey) return;
        
        const nodeId = agent.dbNodeKey;
        const taskId = command.taskid;
        
        // Find the task
        if (!obj.agentTasks[nodeId]) return;
        
        const tasks = obj.agentTasks[nodeId];
        for (let i = 0; i < tasks.length; i++) {
            if (tasks[i].id === taskId) {
                // Clear timeout timer if it exists
                if (tasks[i].timeoutTimer) {
                    clearTimeout(tasks[i].timeoutTimer);
                    delete tasks[i].timeoutTimer;
                }
                
                // Update task status based on agent response
                tasks[i].status = command.status || 'complete';
                tasks[i].completeTime = Date.now();
                tasks[i].result = command.result || {};
                
                // Remove completed/failed tasks after processing
                if (tasks[i].status === 'complete' || tasks[i].status === 'failed') {
                    // You could add additional processing here if needed
                    // For example, callback notifications or logging
                    
                    // Remove the task from the queue after a delay to allow status polling
                    setTimeout(() => {
                        if (obj.agentTasks[nodeId]) {
                            const idx = obj.agentTasks[nodeId].findIndex(t => t.id === taskId);
                            if (idx >= 0) obj.agentTasks[nodeId].splice(idx, 1);
                            
                            // Clean up empty agent task lists
                            if (obj.agentTasks[nodeId].length === 0) {
                                delete obj.agentTasks[nodeId];
                            }
                        }
                    }, 3600000); // Keep completed tasks for 1 hour for status checking
                }
                
                break;
            }
        }
    };

    // Get all tasks for a node
    obj.getNodeTasks = function (nodeId) {
        if (!nodeId || !obj.agentTasks[nodeId]) return [];
        return obj.agentTasks[nodeId].map(task => ({
            id: task.id,
            type: task.type,
            status: task.status,
            addTime: task.addTime,
            sentTime: task.sentTime,
            completeTime: task.completeTime,
            result: task.result
        }));
    };
    
    // Get all tasks in the system
    obj.getAllTasks = function () {
        const allTasks = [];
        for (const nodeId in obj.agentTasks) {
            const nodeTasks = obj.agentTasks[nodeId].map(task => ({
                id: task.id,
                nodeId: nodeId,
                type: task.type,
                status: task.status,
                addTime: task.addTime,
                sentTime: task.sentTime,
                completeTime: task.completeTime
            }));
            allTasks.push(...nodeTasks);
        }
        return allTasks;
    };
    
    return obj;
}