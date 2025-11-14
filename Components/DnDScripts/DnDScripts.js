const DragAndDrop = (function() {
    let draggedElement = null;

    // Setup drag and drop functionality
    function setupDragAndDrop(tasks, saveTasks, renderTasks) {
        const taskItems = document.querySelectorAll('.task-item');
        
        taskItems.forEach((item) => {
            item.addEventListener('dragstart', (e) => handleDragStart(e, item));
            item.addEventListener('dragend', (e) => handleDragEnd(e, item));
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', (e) => handleDrop(e, item, tasks, saveTasks, renderTasks));
            item.addEventListener('dragenter', (e) => handleDragEnter(e, item));
            item.addEventListener('dragleave', handleDragLeave);
        });
    }

    // Drag and drop event handlers
    function handleDragStart(e, element) {
        draggedElement = element;
        element.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', element.innerHTML);
    }

    function handleDragEnd(e, element) {
        element.classList.remove('dragging');
        
        // Remove all drag-over classes
        document.querySelectorAll('.task-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e, element) {
        if (element !== draggedElement) {
            element.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    function handleDrop(e, element, tasks, saveTasks, renderTasks) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        if (draggedElement !== element) {
            const draggedTaskId = parseInt(draggedElement.dataset.id);
            const dropTaskId = parseInt(element.dataset.id);
            
            // Find tasks in array
            const draggedTask = tasks.find(t => t.id === draggedTaskId);
            const dropTask = tasks.find(t => t.id === dropTaskId);
            
            if (draggedTask && dropTask) {
                // Swap order values
                const tempOrder = draggedTask.order;
                draggedTask.order = dropTask.order;
                dropTask.order = tempOrder;
                
                // Save and re-render
                saveTasks();
                renderTasks();
            }
        }
        
        element.classList.remove('drag-over');
        return false;
    }

    // Public API
    return {
        setupDragAndDrop: setupDragAndDrop
    };
})();
