// Frontend JavaScript for MCP Client Interface

class MCPWebInterface {
    constructor() {
        this.apiBase = '/api';
        this.servers = [];
        this.tools = [];
        this.isConnected = false;
        this.chatMessages = [];

        this.initializeElements();
        this.setupEventListeners();
        this.initialize();
    }

    initializeElements() {
        // Status elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.minioStatus = document.getElementById('minioStatus');
        this.minioStatusText = document.getElementById('minioStatusText');

        // Panel elements
        this.serversList = document.getElementById('serversList');
        this.toolsList = document.getElementById('toolsList');
        this.toolCount = document.getElementById('toolCount');
        this.serverCount = document.getElementById('serverCount');
        this.toolCountBadge = document.getElementById('toolCountBadge');
        this.refreshBtn = document.getElementById('refreshTools');
        this.cpolarTestBtn = document.getElementById('cpolarTest');

        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.typingIndicator = document.getElementById('typingIndicator');

        // File upload elements
        this.fileInput = document.getElementById('fileInput');
        this.fileUploadBtn = document.getElementById('fileUploadBtn');
        this.uploadedFiles = document.getElementById('uploadedFiles');
        this.filesList = document.getElementById('filesList');

        // Modals
        this.loadingModal = document.getElementById('loadingModal');
        this.errorModal = document.getElementById('errorModal');
        this.downloadModal = document.getElementById('downloadModal');

        // File management
        this.selectedFiles = new Map(); // Map to store selected files

        // Server configuration modal
        this.serverConfigModal = document.getElementById('serverConfigModal');
        this.serverConfigForm = document.getElementById('serverConfigForm');
        this.addServerBtn = document.getElementById('addServerBtn');
        this.currentEditingServer = null; // Track if we're editing or adding
    }

    setupEventListeners() {
        // Chat functionality
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.chatInput.addEventListener('input', () => this.handleInputChange());

        // Tools panel
        this.refreshBtn.addEventListener('click', () => this.refreshTools());
        this.cpolarTestBtn.addEventListener('click', () => this.testCpolar());

        // Auto-resize textarea
        this.chatInput.addEventListener('input', () => this.autoResizeTextarea());

        // File upload
        this.fileUploadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelection(e));

        // Server configuration
        this.addServerBtn.addEventListener('click', () => this.showServerConfigModal());
        this.serverConfigForm.addEventListener('submit', (e) => this.handleServerConfigSubmit(e));
    }

    async initialize() {
        try {
            this.updateStatus('connecting', 'Connecting to servers...');

            // Load servers and tools
            await this.loadServers();
            await this.loadTools();

            // Check MinIO status
            await this.checkMinIOStatus();

            this.updateStatus('connected', 'Connected');
            this.isConnected = true;
            this.handleInputChange(); // Enable send button if there's text
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.updateStatus('error', 'Connection failed');
            this.showError(`Failed to connect: ${error.message}`);
            this.isConnected = false;
        }
    }

    updateStatus(status, text) {
        this.statusIndicator.className = `status-indicator ${status}`;
        this.statusText.textContent = text;
    }

    async checkMinIOStatus() {
        try {
            const response = await fetch(`${this.apiBase}/minio/health`);

            if (!response.ok) {
                throw new Error(`MinIO health check failed: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.health.status === 'healthy') {
                this.updateMinIOStatus('healthy', `MinIO (${result.health.bucket})`);
            } else {
                this.updateMinIOStatus('error', 'MinIO Error');
            }
        } catch (error) {
            console.error('MinIO health check failed:', error);
            this.updateMinIOStatus('error', 'MinIO Offline');
        }
    }

    updateMinIOStatus(status, text) {
        this.minioStatus.className = `minio-status ${status}`;
        this.minioStatusText.textContent = text;
    }

    async loadServers() {
        const response = await fetch(`${this.apiBase}/servers`);

        if (!response.ok) {
            throw new Error(`Failed to load servers: ${response.status}`);
        }

        const result = await response.json();
        this.servers = result.servers || [];
        this.renderServers();
        return result;
    }

    async connectToServers() {
        const response = await fetch(`${this.apiBase}/connect`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`Connection failed: ${response.status}`);
        }

        const result = await response.json();
        return result;
    }

    async loadTools() {
        const response = await fetch(`${this.apiBase}/tools`);

        if (!response.ok) {
            throw new Error(`Failed to load tools: ${response.status}`);
        }

        const result = await response.json();
        this.tools = result.tools || [];

        this.renderTools();
        this.updateToolCount();
    }

    renderServers() {
        this.serversList.innerHTML = '';

        if (this.servers.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-state';
            emptyDiv.innerHTML = `
                <i class="fas fa-server"></i>
                No MCP servers configured.<br>
                Click the + button to add your first server.
            `;
            this.serversList.appendChild(emptyDiv);
        } else {
            this.servers.forEach(server => {
                const serverElement = this.createServerElement(server);
                this.serversList.appendChild(serverElement);
            });
        }

        this.updateServerCount();
    }

    createServerElement(server) {
        const div = document.createElement('div');
        div.className = 'server-item';

        div.innerHTML = `
            <div class="server-info">
                <div class="server-name">${server.name}</div>
                <div class="server-url" title="${server.url}">${server.url}</div>
            </div>
            <div class="server-actions">
                <button class="server-edit-btn" title="Edit Server" data-server-name="${server.name}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="server-delete-btn" title="Delete Server" data-server-name="${server.name}">
                    <i class="fas fa-trash"></i>
                </button>
                <label class="toggle-switch">
                    <input type="checkbox" class="toggle-input" ${server.isOpen ? 'checked' : ''} 
                           data-server-name="${server.name}">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `;

        // Add event listeners after creating the element
        const toggle = div.querySelector('.toggle-input');
        toggle.addEventListener('change', (e) => {
            this.toggleServer(server.name, e.target.checked);
        });

        const editBtn = div.querySelector('.server-edit-btn');
        editBtn.addEventListener('click', () => this.editServer(server));

        const deleteBtn = div.querySelector('.server-delete-btn');
        deleteBtn.addEventListener('click', () => this.deleteServer(server.name));

        return div;
    }

    renderTools() {
        this.toolsList.innerHTML = '';

        if (this.tools.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-state';
            emptyDiv.innerHTML = `
                <i class="fas fa-wrench"></i>
                No tools available.<br>
                Enable servers to load tools.
            `;
            this.toolsList.appendChild(emptyDiv);
        } else {
            this.tools.forEach(tool => {
                const toolElement = this.createToolElement(tool);
                this.toolsList.appendChild(toolElement);
            });
        }

        this.updateToolCount();
    }

    createToolElement(tool) {
        const div = document.createElement('div');
        div.className = `tool-item ${tool.enabled !== false ? 'enabled' : ''}`;

        const statusClass = tool.enabled !== false ? 'enabled' : 'disabled';
        const statusText = tool.enabled !== false ? 'READY' : 'OFFLINE';

        div.innerHTML = `
            <div class="tool-header">
                <div class="tool-name">${tool.name}</div>
                <div class="tool-status ${statusClass}">${statusText}</div>
            </div>
            <div class="tool-description">${tool.description || 'No description available'}</div>
            ${tool.serverName ? `<div class="tool-server">from ${tool.serverName}</div>` : ''}
        `;

        return div;
    }

    async toggleServer(serverName, enabled) {
        console.log(`🔄 Toggling server ${serverName} to ${enabled ? 'enabled' : 'disabled'}`);

        const toggleElement = document.querySelector(`[data-server-name="${serverName}"]`);
        const serverItem = toggleElement.closest('.server-item');

        if (toggleElement) {
            toggleElement.disabled = true;
            serverItem.style.opacity = '0.6';
            serverItem.classList.remove('stuck-loading'); // Clear previous stuck state
        }

        try {
            const response = await fetch(`${this.apiBase}/servers/${serverName}/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Request failed: ${response.status}`);
            }

            const result = await response.json();
            console.log(`✅ Server ${serverName} ${enabled ? 'enabled' : 'disabled'}`);

            this.addSystemMessage(`Server "${serverName}" has been ${enabled ? 'enabled' : 'disabled'}.`);
            await this.loadServers();
            await this.loadTools();

        } catch (error) {
            console.error(`❌ Failed to toggle server '${serverName}':`, error);
            this.showError(`Failed to toggle server: ${error.message}`);

            // If enabling the cpolar server fails, put it in a "stuck" state
            const isCpolarServer = serverName === 'doc-gen-test';
            if (isCpolarServer && enabled) {
                serverItem.classList.add('stuck-loading');
                // Keep the toggle checked but disabled to show the failed attempt
                toggleElement.checked = true;
            } else {
                // For all other failures, revert the toggle state
                if (toggleElement) {
                    toggleElement.checked = !enabled;
                }
            }
        } finally {
            // Re-enable the toggle only if it's not stuck
            if (toggleElement && !serverItem.classList.contains('stuck-loading')) {
                toggleElement.disabled = false;
                serverItem.style.opacity = '1';
            }
        }
    }

    async refreshTools() {
        this.refreshBtn.style.transform = 'rotate(360deg)';

        try {
            await this.loadTools();
        } catch (error) {
            console.error('Failed to refresh tools:', error);
            this.showError('Failed to refresh tools: ' + error.message);
        } finally {
            setTimeout(() => {
                this.refreshBtn.style.transform = 'rotate(0deg)';
            }, 500);
        }
    }

    async testCpolar() {
        this.cpolarTestBtn.disabled = true;
        this.cpolarTestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';

        try {
            const response = await fetch(`${this.apiBase}/cpolar/test`);
            const result = await response.json();

            if (response.ok) {
                this.addSystemMessage('Cpolar Test Results:\n' + JSON.stringify(result, null, 2));
            } else {
                throw new Error(result.error || 'Cpolar test failed');
            }

        } catch (error) {
            console.error('Cpolar test failed:', error);
            this.showError('Cpolar test failed: ' + error.message);
        } finally {
            this.cpolarTestBtn.disabled = false;
            this.cpolarTestBtn.innerHTML = '<i class="fas fa-globe"></i> Test Cpolar';
        }
    }

    updateToolCount() {
        const enabledTools = this.tools.filter(tool => tool.enabled !== false);

        // Update the main tool count element (bottom of chat)
        if (this.toolCount) {
            this.toolCount.textContent = `${enabledTools.length} tools available`;
        }

        // Update the tool count badge in the panel
        if (this.toolCountBadge) {
            this.toolCountBadge.textContent = this.tools.length.toString();
            if (this.tools.length > 0) {
                this.toolCountBadge.classList.add('has-tools');
            } else {
                this.toolCountBadge.classList.remove('has-tools');
            }
        }
    }

    updateServerCount() {
        if (this.serverCount) {
            this.serverCount.textContent = this.servers.length.toString();
            if (this.servers.length > 0) {
                this.serverCount.classList.add('has-servers');
            } else {
                this.serverCount.classList.remove('has-servers');
            }
        }
    }

    handleInputChange() {
        const hasContent = this.chatInput.value.trim().length > 0;
        const hasFiles = this.selectedFiles.size > 0;
        this.sendBtn.disabled = (!hasContent && !hasFiles) || !this.isConnected;
    }

    autoResizeTextarea() {
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || !this.isConnected) return;

        // Display user message with files if any
        let userMessageContent = message;
        if (this.selectedFiles.size > 0) {
            const fileNames = Array.from(this.selectedFiles.values()).map(f => f.name).join(', ');
            userMessageContent += `\n📎 Files: ${fileNames}`;
        }

        // Add user message to chat
        this.addUserMessage(userMessageContent);
        this.chatInput.value = '';
        this.handleInputChange();
        this.autoResizeTextarea();

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Upload files first if any
            let uploadedFiles = [];
            if (this.selectedFiles.size > 0) {
                this.addSystemMessage('Uploading files...');
                uploadedFiles = await this.uploadFiles();

                if (uploadedFiles.length > 0) {
                    this.addSystemMessage(`✅ ${uploadedFiles.length} file(s) uploaded successfully.`);
                }
            }

            // Send message with file information
            const requestBody = {
                message,
                files: uploadedFiles
            };

            const response = await fetch(`${this.apiBase}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Chat request failed: ${response.status}`);
            }

            const result = await response.json();

            // Hide typing indicator
            this.hideTypingIndicator();

            // Add AI response
            this.addAssistantMessage(result.response);

            // Clear uploaded files after successful send
            this.selectedFiles.clear();
            this.updateFileDisplay();
            this.updateFileUploadButton();

            // Handle download URLs if present
            if (result.downloadUrl) {
                this.showDownloadModal(result);
            }

        } catch (error) {
            this.hideTypingIndicator();
            console.error('Chat error:', error);
            this.addSystemMessage('Error: ' + error.message);
        }
    }

    addUserMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-icon">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <p>${this.escapeHtml(content)}</p>
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addAssistantMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message';

        // Parse content for download URLs
        const processedContent = this.processMessageContent(content);

        messageDiv.innerHTML = `
            <div class="message-icon">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                ${processedContent}
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addSystemMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system-message';
        messageDiv.innerHTML = `
            <div class="message-icon">
                <i class="fas fa-info-circle"></i>
            </div>
            <div class="message-content">
                <pre style="white-space: pre-wrap; font-family: 'Monaco', monospace; font-size: 12px;">${this.escapeHtml(content)}</pre>
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    processMessageContent(content) {
        // Create a safe processing approach to avoid conflicts
        let processed = content;
        const placeholders = [];
        let placeholderIndex = 0;

        // Helper function to create unique placeholders
        const createPlaceholder = (html) => {
            const placeholder = `__DOWNLOAD_LINK_${placeholderIndex++}__`;
            placeholders.push({ placeholder, html });
            return placeholder;
        };

        // 1. Handle markdown-style links [text](url) first
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        processed = processed.replace(markdownLinkRegex, (match, text, url) => {
            const escapedText = this.escapeHtml(text);
            const escapedUrl = this.escapeHtml(url);
            if (url.includes('/api/download/') || url.match(/\.(docx|pdf|txt|xlsx|doc)$/i)) {
                const html = `<a href="${escapedUrl}" class="download-link" target="_blank">
                    <i class="fas fa-download"></i>
                    ${escapedText}
                </a>`;
                return createPlaceholder(html);
            } else {
                const html = `<a href="${escapedUrl}" target="_blank">${escapedText}</a>`;
                return createPlaceholder(html);
            }
        });

        // 2. Handle server file paths (avoid URLs already in placeholders)
        const serverPathRegex = /\/minio\/download\/([^\s]*\.(docx|pdf|txt|xlsx|doc))/gi;
        processed = processed.replace(serverPathRegex, (match, minioKey) => {
            // Skip if this is already inside a placeholder
            const beforeMatch = processed.substring(0, processed.indexOf(match));
            if (/__DOWNLOAD_LINK_\d+__/.test(beforeMatch.split('\n').pop())) {
                return match; // Don't replace if it's part of an existing link
            }

            const filename = minioKey.split('/').pop();
            const downloadUrl = window.location.origin + '/api/download/' + minioKey;
            const html = `<a href="${this.escapeHtml(downloadUrl)}" class="download-link" target="_blank">
                <i class="fas fa-download"></i>
                Download ${this.escapeHtml(filename)}
            </a>`;
            return createPlaceholder(html);
        });

        // 3. Handle quoted file paths
        const quotedPathRegex = /`([^`]*\/minio\/download\/mcp-files\/([^`]*\.(docx|pdf|txt|xlsx|doc)))`/gi;
        processed = processed.replace(quotedPathRegex, (match, fullPath, minioKey) => {
            const filename = minioKey.split('/').pop();
            const downloadUrl = window.location.origin + '/api/download/' + minioKey;
            const html = `<a href="${this.escapeHtml(downloadUrl)}" class="download-link" target="_blank">
                <i class="fas fa-download"></i>
                Download ${this.escapeHtml(filename)}
            </a>`;
            return createPlaceholder(html);
        });

        // 4. Handle standalone download URLs (be more careful)
        const urlRegex = /(https?:\/\/[^\s]+\.(docx|pdf|txt|xlsx|doc))(?!\s*")/gi;
        processed = processed.replace(urlRegex, (url) => {
            // Skip if this URL is already processed
            const beforeMatch = processed.substring(0, processed.indexOf(url));
            if (/__DOWNLOAD_LINK_\d+__/.test(beforeMatch.split('\n').pop())) {
                return url;
            }

            const html = `<a href="${this.escapeHtml(url)}" class="download-link" target="_blank">
                <i class="fas fa-download"></i>
                Download Document
            </a>`;
            return createPlaceholder(html);
        });

        // 5. Now escape all remaining content
        processed = this.escapeHtml(processed);

        // 6. Apply text formatting to escaped content
        processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        processed = processed.replace(/\n/g, '<br>');

        // 7. Replace placeholders with actual HTML
        placeholders.forEach(({ placeholder, html }) => {
            processed = processed.replace(this.escapeHtml(placeholder), html);
        });

        return `<p>${processed}</p>`;
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showDownloadModal(result) {
        const downloadInfo = document.getElementById('downloadInfo');
        downloadInfo.innerHTML = `
            <div style="text-align: center;">
                <div style="margin-bottom: 16px;">
                    <i class="fas fa-file-alt" style="font-size: 48px; color: #4a9eff; margin-bottom: 12px;"></i>
                    <h3>${result.filename || 'Document'}</h3>
                    <p style="color: #999; margin-bottom: 16px;">${result.message || 'Document generated successfully'}</p>
                </div>
                <a href="${result.downloadUrl}" target="_blank" class="download-link" style="display: inline-flex;">
                    <i class="fas fa-download"></i>
                    Download Document
                </a>
            </div>
        `;
        this.downloadModal.style.display = 'flex';
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.errorModal.style.display = 'flex';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    handleFileSelection(event) {
        const files = Array.from(event.target.files);

        files.forEach(file => {
            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                this.showError(`File "${file.name}" is too large. Maximum size is 10MB.`);
                return;
            }

            // Add file to selected files
            const fileId = Date.now() + '_' + file.name;
            this.selectedFiles.set(fileId, file);
        });

        this.updateFileDisplay();
        this.updateFileUploadButton();
        this.handleInputChange(); // Update send button state

        // Clear the input so the same file can be selected again
        event.target.value = '';
    }

    updateFileDisplay() {
        if (this.selectedFiles.size === 0) {
            this.uploadedFiles.style.display = 'none';
            return;
        }

        this.uploadedFiles.style.display = 'flex';
        this.filesList.innerHTML = '';

        this.selectedFiles.forEach((file, fileId) => {
            const fileTag = document.createElement('div');
            fileTag.className = 'file-tag';

            fileTag.innerHTML = `
                <span class="file-name" title="${file.name}">${file.name}</span>
                <span class="remove-file" onclick="mcpInterface.removeFile('${fileId}')" title="Remove file">×</span>
            `;

            this.filesList.appendChild(fileTag);
        });
    }

    removeFile(fileId) {
        this.selectedFiles.delete(fileId);
        this.updateFileDisplay();
        this.updateFileUploadButton();
        this.handleInputChange();
    }

    updateFileUploadButton() {
        if (this.selectedFiles.size > 0) {
            this.fileUploadBtn.classList.add('has-files');
            this.fileUploadBtn.title = `${this.selectedFiles.size} file(s) selected`;
        } else {
            this.fileUploadBtn.classList.remove('has-files');
            this.fileUploadBtn.title = 'Upload files';
        }
    }

    async uploadFiles() {
        if (this.selectedFiles.size === 0) {
            return [];
        }

        const uploadedFiles = [];

        for (const [fileId, file] of this.selectedFiles) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(`${this.apiBase}/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Upload failed for ${file.name}: ${response.status}`);
                }

                const result = await response.json();
                uploadedFiles.push({
                    name: file.name,
                    path: result.filePath,
                    size: file.size,
                    type: file.type,
                    // MinIO specific information
                    minioUrl: result.url,
                    fileName: result.fileName,
                    bucket: result.bucket,
                    storage: 'minio'
                });

                // Show MinIO upload success message
                console.log(`📦 File uploaded to MinIO: ${result.fileName}`);

            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                this.showError(`Failed to upload ${file.name}: ${error.message}`);
            }
        }

        return uploadedFiles;
    }

    // Server Configuration Modal Management
    showServerConfigModal(server = null) {
        this.currentEditingServer = server;
        const modalTitle = document.getElementById('serverModalTitle');
        const saveBtn = document.getElementById('saveServerBtn');

        if (server) {
            // Editing existing server
            modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit MCP Server';
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Server';

            // Populate form with server data (防止XSS)
            document.getElementById('serverName').value = this.escapeHtml(server.name);
            document.getElementById('serverType').value = this.escapeHtml(server.type);
            document.getElementById('serverUrl').value = this.escapeHtml(server.url);
            document.getElementById('serverEnabled').checked = Boolean(server.isOpen);

            // Make server name read-only when editing
            document.getElementById('serverName').readOnly = true;
        } else {
            // Adding new server
            modalTitle.innerHTML = '<i class="fas fa-server"></i> Add MCP Server';
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Add Server';

            // Clear form
            this.serverConfigForm.reset();
            document.getElementById('serverEnabled').checked = true;

            // Make server name editable when adding
            document.getElementById('serverName').readOnly = false;
        }

        this.serverConfigModal.style.display = 'flex';
        document.getElementById('serverName').focus();
    }

    async handleServerConfigSubmit(event) {
        event.preventDefault();

        const formData = new FormData(this.serverConfigForm);
        const serverData = {
            name: formData.get('serverName') || document.getElementById('serverName').value,
            type: formData.get('serverType') || document.getElementById('serverType').value,
            url: formData.get('serverUrl') || document.getElementById('serverUrl').value,
            isOpen: document.getElementById('serverEnabled').checked
        };

        // 严格的前端输入验证
        if (!serverData.name || !serverData.type || !serverData.url) {
            this.showError('Please fill in all required fields');
            return;
        }

        // 验证服务器名称格式
        const nameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!nameRegex.test(serverData.name) || serverData.name.length > 50) {
            this.showError('Server name must contain only letters, numbers, underscores, and hyphens (max 50 characters)');
            return;
        }

        // 验证服务器类型
        const allowedTypes = ['fastapi-mcp', 'standard'];
        if (!allowedTypes.includes(serverData.type)) {
            this.showError('Invalid server type');
            return;
        }

        // 验证URL格式和协议
        try {
            const parsedUrl = new URL(serverData.url);
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                this.showError('URL must use HTTP or HTTPS protocol');
                return;
            }
            // 基本的URL长度检查
            if (serverData.url.length > 500) {
                this.showError('URL is too long (max 500 characters)');
                return;
            }
        } catch (error) {
            this.showError('Please enter a valid URL (e.g., http://localhost:4242 or https://example.com)');
            return;
        }

        try {
            const isEditing = this.currentEditingServer !== null;
            const endpoint = isEditing
                ? `${this.apiBase}/servers/${encodeURIComponent(serverData.name)}`
                : `${this.apiBase}/servers`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(serverData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server request failed: ${response.status}`);
            }

            const result = await response.json();

            // Show success message
            console.log(`✅ Server ${isEditing ? 'updated' : 'added'} successfully:`, result);

            // Close modal
            this.serverConfigModal.style.display = 'none';
            this.currentEditingServer = null;

            // Refresh server list and tools
            await this.loadServers();
            await this.loadTools();

        } catch (error) {
            console.error('Server configuration error:', error);
            this.showError(`Failed to ${this.currentEditingServer ? 'update' : 'add'} server: ${error.message}`);
        }
    }

    editServer(server) {
        this.showServerConfigModal(server);
    }

    async deleteServer(serverName) {
        if (!confirm(`Are you sure you want to delete the server "${serverName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/servers/${encodeURIComponent(serverName)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Delete failed: ${response.status}`);
            }

            const result = await response.json();
            console.log(`✅ Server deleted successfully:`, result);

            // Refresh server list and tools
            await this.loadServers();
            await this.loadTools();

        } catch (error) {
            console.error('Delete server error:', error);
            this.showError(`Failed to delete server: ${error.message}`);
        }
    }
}

// Modal management
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Initialize the interface when DOM is loaded
let mcpInterface;
document.addEventListener('DOMContentLoaded', () => {
    mcpInterface = new MCPWebInterface();
    mcpInterface.initialize();

    // Make it globally accessible for onclick handlers
    window.mcpInterface = mcpInterface;
});

// Handle window resize for responsive design
window.addEventListener('resize', () => {
    if (mcpInterface && mcpInterface.chatMessages) {
        mcpInterface.scrollToBottom();
    }
}); 