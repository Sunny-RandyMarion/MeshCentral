/**
* @description MeshCentral Agent Task Sample
* @author Sample
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

// This is a sample file demonstrating how to use the agent task functionality
// Do not run this file directly, but use as a reference for your own implementations

// Assuming 'meshserver' is your server object after setup
function agentTaskExample(meshserver) {
    // Get access to the task manager
    const taskManager = meshserver.taskManager;
    
    // Example: Add an echo task for a specific node
    // This will queue the task until the agent connects
    const taskId1 = taskManager.addTask(
        'echo',                  // Task type
        'node123456789',         // Node ID (replace with an actual node ID)
        { message: 'Hello from MeshCentral!' },  // Task data
        { timeout: 30000 }       // Options (optional) - 30 second timeout
    );
    
    console.log(`Echo task queued with ID: ${taskId1}`);
    
    // Example: Add a command execution task
    // This will execute a command on the agent's device
    const taskId2 = taskManager.addTask(
        'command',               // Task type
        'node123456789',         // Node ID (replace with an actual node ID)
        { cmd: 'dir' },          // Windows command (use 'ls -la' for Linux/macOS)
        { timeout: 60000 }       // Options (optional) - 60 second timeout
    );
    
    console.log(`Command task queued with ID: ${taskId2}`);
    
    // Example: Check status of a task
    setTimeout(() => {
        const taskStatus = taskManager.getTaskStatus('node123456789', taskId1);
        console.log('Task status:', taskStatus);
        
        // Example of processing task results
        if (taskStatus && taskStatus.status === 'complete') {
            if (taskStatus.result && taskStatus.result.success) {
                console.log('Task completed successfully:', taskStatus.result);
            } else {
                console.log('Task completed with errors:', taskStatus.result.error);
            }
        }
    }, 10000); // Check after 10 seconds
    
    // Example: Cancel a pending task
    const cancelled = taskManager.cancelTask('node123456789', taskId2);
    console.log(`Task cancellation ${cancelled ? 'successful' : 'failed'}`);
    
    // Example: Get all tasks for a node
    const nodeTasks = taskManager.getNodeTasks('node123456789');
    console.log('All tasks for node:', nodeTasks);
    
    // Example: Get all tasks in the system
    const allTasks = taskManager.getAllTasks();
    console.log('All tasks in the system:', allTasks);
}

// Export the example function
module.exports = agentTaskExample;