const DragAndDrop = (function() {
    let draggedElement = null;
    let currentDropTarget = null;
    let dropPosition = null; // 'above' or 'below'
    let rafId = null;

    // Setup drag and drop functionality
    function setupDragAndDrop(tasks, saveTasks, renderTasks) {
        const taskItems = document.querySelectorAll('.task-item');
        
        taskItems.forEach((item) => {
            item.addEventListener('dragstart', (e) => handleDragStart(e, item));
            item.addEventListener('dragend', (e) => handleDragEnd(e, item));
            item.addEventListener('dragover', (e) => handleDragOver(e, item));
            item.addEventListener('drop', (e) => handleDrop(e, item, tasks, saveTasks, renderTasks));
            item.addEventListener('dragenter', (e) => handleDragEnter(e, item));
            item.addEventListener('dragleave', (e) => handleDragLeave(e, item));
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
        
        // Cancel any pending animation frame
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        
        // Remove all drag-over classes and indicators
        document.querySelectorAll('.task-item').forEach(item => {
            item.classList.remove('drag-over', 'drop-above', 'drop-below');
        });
        
        draggedElement = null;
        currentDropTarget = null;
        dropPosition = null;
    }

    function handleDragOver(e, element) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        
        if (element === draggedElement) {
            return false;
        }
        
        e.dataTransfer.dropEffect = 'move';
        
        // Throttle position updates
        if (rafId === null) {
            rafId = requestAnimationFrame(() => {
                updateDropPosition(e, element);
                rafId = null;
            });
        }
        
        return false;
    }
    
    function updateDropPosition(e, element) {
        const rect = element.getBoundingClientRect();
        const mouseY = e.clientY;
        const elementMiddle = rect.top + rect.height / 2;
        const newDropPosition = mouseY < elementMiddle ? 'above' : 'below';
        
        // Only update if target or position changed
        if (currentDropTarget !== element || dropPosition !== newDropPosition) {
            // Clear previous target
            if (currentDropTarget && currentDropTarget !== element) {
                clearIndicators(currentDropTarget);
            }
            
            currentDropTarget = element;
            dropPosition = newDropPosition;
            
            // Update indicators
            clearIndicators(element);
            element.classList.add('drag-over', `drop-${newDropPosition}`);
        }
    }

    function handleDragEnter(e, element) {
        if (element === draggedElement) {
            return;
        }
        
        // Update immediately on enter
        if (rafId === null) {
            updateDropPosition(e, element);
        }
    }

    function handleDragLeave(e, element) {
        // Only clear if we're actually leaving (not entering a child)
        const relatedTarget = e.relatedTarget;
        if (!element.contains(relatedTarget)) {
            clearIndicators(element);
            if (currentDropTarget === element) {
                currentDropTarget = null;
                dropPosition = null;
            }
        }
    }
    
    function clearIndicators(element) {
        element.classList.remove('drag-over', 'drop-above', 'drop-below');
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
                // Get all tasks sorted by order
                const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
                const draggedIndex = sortedTasks.findIndex(t => t.id === draggedTaskId);
                const dropIndex = sortedTasks.findIndex(t => t.id === dropTaskId);
                
                // Remove dragged task
                sortedTasks.splice(draggedIndex, 1);
                
                // Calculate new index based on drop position
                let newIndex;
                if (dropPosition === 'above') {
                    newIndex = dropIndex > draggedIndex ? dropIndex - 1 : dropIndex;
                } else {
                    newIndex = dropIndex > draggedIndex ? dropIndex : dropIndex + 1;
                }
                
                // Insert at new position
                sortedTasks.splice(newIndex, 0, draggedTask);
                
                // Reassign order values
                sortedTasks.forEach((task, index) => {
                    task.order = index;
                });
                
                // Save and re-render
                saveTasks();
                renderTasks();
            }
        }
        
        clearIndicators(element);
        return false;
    }

    // Public API
    return {
        setupDragAndDrop: setupDragAndDrop
    };
})();
