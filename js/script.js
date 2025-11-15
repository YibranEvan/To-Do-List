const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');

// State
var tasks = [];
// Initialize app
function init() {
    loadTasks();
    renderTasks();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
}

// Load tasks from localStorage
function loadTasks() {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateTaskCount();
}

// Update task count display
function updateTaskCount() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    taskCount.textContent = `${completed} of ${total} tasks completed`;
}

// Create a new task
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        taskInput.focus();
        return;
    }
    
    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        order: tasks.length
    };
    
    tasks.push(newTask);
    
    // Remove empty state if it exists
    const emptyState = taskList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Add only the new task element
    const taskItem = createTaskElement(newTask, tasks.length - 1);
    taskList.appendChild(taskItem);
    
    // Setup drag and drop for the new item
    DragAndDrop.setupDragAndDrop(tasks, saveTasks, updateTaskOrder);
    
    saveTasks();
    updateTaskCount();
    taskInput.value = '';
    taskInput.focus();
}

// Delete a task
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    // Reorder remaining tasks
    tasks.forEach((task, index) => {
        task.order = index;
    });
    
    // Remove only the specific element from DOM
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
        taskElement.remove();
    }
    
    // Check if list is empty
    if (tasks.length === 0) {
        taskList.innerHTML = '<li class="empty-state"><p>No tasks yet. Add one above!</p></li>';
    }
    
    saveTasks();
    updateTaskCount();
}

// Toggle task completion
function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        
        // Update only the specific element
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        if (taskElement) {
            if (task.completed) {
                taskElement.classList.add('completed');
            } else {
                taskElement.classList.remove('completed');
            }
            const checkbox = taskElement.querySelector('.task-checkbox');
            if (checkbox) {
                checkbox.checked = task.completed;
            }
        }
        
        saveTasks();
        updateTaskCount();
    }
}

// Edit a task
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const taskItem = document.querySelector(`[data-id="${id}"]`);
    const taskTextElement = taskItem.querySelector('.task-text');
    const currentText = task.text;
    
    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-text editing';
    input.value = currentText;
    
    // Replace text with input
    taskTextElement.replaceWith(input);
    input.focus();
    input.select();
    
    // Save on Enter or blur
    const saveEdit = () => {
        const newText = input.value.trim();
        if (newText === '') {
            deleteTask(id);
            return;
        }
        
        task.text = newText;
        
        // Update only the text element (input is already the .task-text element)
        const newTextSpan = document.createElement('span');
        newTextSpan.className = 'task-text';
        newTextSpan.textContent = newText;
        input.replaceWith(newTextSpan);
        
        saveTasks();
    };
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        }
    });
    
    input.addEventListener('blur', saveEdit);
}

// Render all tasks
function renderTasks() {
    // Sort tasks by order
    tasks.sort((a, b) => a.order - b.order);
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<li class="empty-state"><p>No tasks yet. Add one above!</p></li>';
        updateTaskCount();
        return;
    }
    
    taskList.innerHTML = '';
    
    tasks.forEach((task, index) => {
        const taskItem = createTaskElement(task, index);
        taskList.appendChild(taskItem);
    });
    
    updateTaskCount();
    // Use DragAndDrop module (loaded via script tag)
    DragAndDrop.setupDragAndDrop(tasks, saveTasks, updateTaskOrder);
}

// Update task order in DOM without full re-render
function updateTaskOrder() {
    // Sort tasks by order
    tasks.sort((a, b) => a.order - b.order);
    
    // Get all task elements
    const taskElements = Array.from(taskList.querySelectorAll('.task-item'));
    
    // Sort elements to match task order
    taskElements.sort((a, b) => {
        const idA = parseInt(a.dataset.id);
        const idB = parseInt(b.dataset.id);
        const taskA = tasks.find(t => t.id === idA);
        const taskB = tasks.find(t => t.id === idB);
        return (taskA?.order || 0) - (taskB?.order || 0);
    });
    
    // Re-append in correct order (only moves elements, doesn't recreate)
    taskElements.forEach(element => {
        taskList.appendChild(element);
    });
    
    // Update dataset.index for all items
    taskElements.forEach((element, index) => {
        element.dataset.index = index;
    });
}

// Create a task element
function createTaskElement(task, index) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.draggable = true;
    li.dataset.id = task.id;
    li.dataset.index = index;
    
    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleComplete(task.id));
    
    // Task text
    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.text;
    
    // Edit button with icon
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.setAttribute('aria-label', 'Edit task');
    const editIcon = document.createElement('img');
    editIcon.src = 'icons/edit.svg';
    editIcon.alt = 'Edit';
    editIcon.className = 'btn-icon';
    editBtn.appendChild(editIcon);
    editBtn.addEventListener('click', () => editTask(task.id));
    
    // Delete button with icon
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    const deleteIcon = document.createElement('img');
    deleteIcon.src = 'icons/trash.svg';
    deleteIcon.alt = 'Delete';
    deleteIcon.className = 'btn-icon';
    deleteBtn.appendChild(deleteIcon);
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    const actions = document.createElement('div');
    actions.className = 'task-actions';
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    li.appendChild(checkbox);
    li.appendChild(taskText);
    li.appendChild(actions);
    
    return li;
}


// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);