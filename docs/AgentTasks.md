# MeshCentral Agent Tasks

MeshCentral includes functionality to queue and execute tasks on connected agents. This document explains how to use the task functionality.

## Overview

The agent task system allows you to:
- Queue tasks for specific agents
- Track task status
- Process task results
- Handle disconnected agents

Tasks are queued until the agent connects, and are then dispatched automatically.

## Using the Task Manager

### Adding a Task

```javascript
// Get the taskManager from the main server object
const taskManager = meshserver.taskManager;

// Add a task (returns taskId)
const taskId = taskManager.addTask(
    'echo',                  // Task type
    'node123456789',         // Node ID
    { message: 'Hello' },    // Task data
    { timeout: 30000 }       // Options (optional)
);
```

### Getting Task Status

```javascript
// Get status of a specific task
const taskStatus = taskManager.getTaskStatus('node123456789', taskId);

// Example taskStatus object
// {
//   id: 1,
//   type: 'echo',
//   status: 'complete', // pending, sent, complete, failed, cancelled
//   addTime: 1621345678901,
//   result: { success: true, data: { message: 'Hello' } }
// }
```

### Cancelling a Task

```javascript
// Cancel a pending task
const cancelled = taskManager.cancelTask('node123456789', taskId);
```

### Getting All Tasks for a Node

```javascript
// Get all tasks for a specific node
const nodeTasks = taskManager.getNodeTasks('node123456789');
```

### Getting All Tasks

```javascript
// Get all tasks in the system
const allTasks = taskManager.getAllTasks();
```

## Supported Task Types

The system includes support for these default task types:

1. `echo` - Simple echo test, returns the data sent
2. `command` - Executes a command on the agent's device

### Echo Task Example

```javascript
const taskId = taskManager.addTask(
    'echo', 
    nodeId, 
    { message: 'Test message' }
);
```

### Command Task Example

```javascript
const taskId = taskManager.addTask(
    'command', 
    nodeId, 
    { cmd: 'dir' }, // Windows command, use appropriate command for other platforms
    { timeout: 60000 } // Set a 60 second timeout
);
```

## Agent Console Commands

Agents include a new console command to manually test tasks:

```
agenttask echo "test data"
agenttask command "dir"
```

## Custom Task Types

You can extend the system with custom task types by modifying the agent's task handler. Add new case statements to handle additional task types in the agent's script-task handler.