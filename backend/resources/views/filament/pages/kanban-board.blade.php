<x-filament-panels::page>
    <style>
        .kanban-board {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            min-height: 70vh;
            padding: 1rem 0;
        }

        .kanban-column {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            flex-direction: column;
            min-height: 400px;
        }

        .kanban-column-header {
            padding: 1rem 1.25rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .kanban-column-title {
            font-weight: 600;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .kanban-column-count {
            background: rgba(255, 255, 255, 0.1);
            padding: 0.25rem 0.625rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .kanban-column-body {
            flex: 1;
            padding: 0.75rem;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .kanban-card {
            background: rgba(17, 24, 39, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 1rem;
            cursor: grab;
            transition: all 0.2s ease;
        }

        .kanban-card:hover {
            border-color: rgba(249, 115, 22, 0.5);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.3);
        }

        .kanban-card:active {
            cursor: grabbing;
        }

        .kanban-card-title {
            font-weight: 500;
            font-size: 0.875rem;
            color: #fff;
            margin-bottom: 0.5rem;
            line-height: 1.4;
        }

        .kanban-card-description {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.5);
            margin-bottom: 0.75rem;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .kanban-card-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 0.75rem;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .kanban-card-priority {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.625rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
        }

        .priority-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        .priority-high {
            background: #ef4444;
        }

        .priority-medium {
            background: #f59e0b;
        }

        .priority-low {
            background: #22c55e;
        }

        .kanban-card-meta {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .kanban-card-avatar {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.625rem;
            font-weight: 700;
            color: #fff;
        }

        .kanban-card-due {
            font-size: 0.625rem;
            color: rgba(255, 255, 255, 0.4);
        }

        .kanban-card-due.overdue {
            color: #ef4444;
        }

        .kanban-drop-zone {
            min-height: 100px;
            border: 2px dashed transparent;
            border-radius: 8px;
            transition: all 0.2s ease;
            flex: 1;
        }

        .kanban-drop-zone.drag-over {
            border-color: rgba(249, 115, 22, 0.5);
            background: rgba(249, 115, 22, 0.05);
        }

        .kanban-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.25);
            font-size: 0.75rem;
            padding: 2rem;
            text-align: center;
        }

        /* Column-specific colors */
        .column-todo .kanban-column-header {
            border-left: 3px solid #6b7280;
        }

        .column-in_progress .kanban-column-header {
            border-left: 3px solid #3b82f6;
        }

        .column-review .kanban-column-header {
            border-left: 3px solid #f59e0b;
        }

        .column-done .kanban-column-header {
            border-left: 3px solid #22c55e;
        }

        .column-todo .kanban-column-title {
            color: #9ca3af;
        }

        .column-in_progress .kanban-column-title {
            color: #60a5fa;
        }

        .column-review .kanban-column-title {
            color: #fbbf24;
        }

        .column-done .kanban-column-title {
            color: #4ade80;
        }

        .kanban-card-actions {
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        .kanban-card:hover .kanban-card-actions {
            opacity: 1;
        }

        .kanban-edit-btn {
            padding: 0.25rem;
            border-radius: 4px;
            color: rgba(255, 255, 255, 0.4);
            transition: all 0.15s ease;
        }

        .kanban-edit-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
        }
    </style>

    <div class="kanban-board" x-data="{
        draggedId: null,
        updateStatus(id, status) {
            $wire.updateTaskStatus(id, status);
        }
    }">
        @php
            $columns = [
                'todo' => ['title' => 'To Do', 'icon' => '○'],
                'in_progress' => ['title' => 'In Progress', 'icon' => '◐'],
                'review' => ['title' => 'Review', 'icon' => '◑'],
                'done' => ['title' => 'Done', 'icon' => '●'],
            ];
        @endphp

        @foreach ($columns as $statusKey => $config)
            <div class="kanban-column column-{{ $statusKey }}">
                <div class="kanban-column-header">
                    <div class="kanban-column-title">
                        <span>{{ $config['icon'] }}</span>
                        <span>{{ $config['title'] }}</span>
                    </div>
                    <span class="kanban-column-count">{{ $tasks->where('status', $statusKey)->count() }}</span>
                </div>

                <div class="kanban-column-body kanban-drop-zone" x-on:drop.prevent="
                            $el.classList.remove('drag-over');
                            updateStatus(draggedId, '{{ $statusKey }}');
                        " x-on:dragover.prevent="$el.classList.add('drag-over')"
                    x-on:dragleave="$el.classList.remove('drag-over')">
                    @forelse ($tasks->where('status', $statusKey) as $task)
                        <div class="kanban-card" draggable="true" x-on:dragstart="draggedId = {{ $task->id }}"
                            x-on:dragend="draggedId = null">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div class="kanban-card-title">{{ $task->title }}</div>
                                <div class="kanban-card-actions">
                                    <a href="{{ \App\Filament\Resources\Tasks\TaskResource::getUrl('edit', ['record' => $task->id]) }}"
                                        class="kanban-edit-btn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                            stroke-linejoin="round">
                                            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            @if($task->description)
                                <div class="kanban-card-description">{{ $task->description }}</div>
                            @endif

                            <div class="kanban-card-footer">
                                <div class="kanban-card-priority">
                                    <span class="priority-dot priority-{{ $task->priority ?? 'low' }}"></span>
                                    <span style="color: rgba(255,255,255,0.4);">{{ ucfirst($task->priority ?? 'low') }}</span>
                                </div>

                                <div class="kanban-card-meta">
                                    @if($task->due_date)
                                        <span class="kanban-card-due {{ $task->due_date->isPast() ? 'overdue' : '' }}">
                                            {{ $task->due_date->format('M d') }}
                                        </span>
                                    @endif

                                    @if($task->assignee)
                                        <div class="kanban-card-avatar" title="{{ $task->assignee->name }}">
                                            {{ strtoupper(substr($task->assignee->name, 0, 1)) }}
                                        </div>
                                    @endif
                                </div>
                            </div>
                        </div>
                    @empty
                        <div class="kanban-empty">
                            No tasks
                        </div>
                    @endforelse
                </div>
            </div>
        @endforeach
    </div>
</x-filament-panels::page>