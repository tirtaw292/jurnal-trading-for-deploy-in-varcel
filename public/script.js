// Configuration
const APP_USERNAME = "admin";
const APP_PASSWORD = "trading123"; // In production, use a more secure password

// Data storage
let trades = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Load trades from localStorage
    loadTrades();
    
    // Setup login/logout
    setupAuth();
    
    // Setup tabs
    setupTabs();
    
    // Setup trade form
    setupTradeForm();
    
    // Setup calendar
    setupCalendar();
    
    // Setup export/import
    setupExcelFeatures();
    
    // If already logged in, show app
    if (isLoggedIn()) {
        showApp();
    }
});

// Authentication functions
function setupAuth() {
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username === APP_USERNAME && password === APP_PASSWORD) {
            login();
        } else {
            document.getElementById('login-error').textContent = 'Invalid username or password';
        }
    });
    
    document.getElementById('logout-btn').addEventListener('click', logout);
}

function isLoggedIn() {
    return localStorage.getItem('trading_journal_logged_in') === 'true';
}

function login() {
    localStorage.setItem('trading_journal_logged_in', 'true');
    showApp();
}

function logout() {
    localStorage.removeItem('trading_journal_logged_in');
    showLogin();
    document.getElementById('login-form').reset();
    document.getElementById('login-error').textContent = '';
}

function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    renderTradeList();
    updateStatistics();
    generateCalendar(new Date());
}

function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-content').style.display = 'none';
}

// Trade data functions
function loadTrades() {
    try {
        const savedData = localStorage.getItem('trading_journal_data');
        if (savedData) {
            trades = JSON.parse(savedData);
            if (!Array.isArray(trades)) trades = [];
        }
    } catch (e) {
        console.error('Error loading trades:', e);
        trades = [];
    }
}

function saveTrades() {
    try {
        localStorage.setItem('trading_journal_data', JSON.stringify(trades));
    } catch (e) {
        alert('Error saving data. Your browser storage might be full.');
        console.error('Save error:', e);
    }
}

function calculateProfit(entry, exit, size, pair) {
    const isPipPair = pair ? pair.includes('JPY') : false;
    const pips = (exit - entry) * (isPipPair ? 100 : 10000);
    return pips * size;
}

// Trade form functions
function setupTradeForm() {
    const tradeForm = document.getElementById('trade-form');
    
    tradeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const trade = {
            date: document.getElementById('trade-date').value,
            pair: document.getElementById('currency-pair').value,
            entry: parseFloat(document.getElementById('entry-price').value),
            exit: parseFloat(document.getElementById('exit-price').value),
            size: parseFloat(document.getElementById('position-size').value),
            outcome: document.getElementById('trade-outcome').value,
            news: document.getElementById('news-impact').value,
            notes: document.getElementById('notes').value || '',
            profit: calculateProfit(
                parseFloat(document.getElementById('entry-price').value),
                parseFloat(document.getElementById('exit-price').value),
                parseFloat(document.getElementById('position-size').value),
                document.getElementById('currency-pair').value
            )
        };
        
        const editIndex = parseInt(document.getElementById('edit-index').value);
        if (editIndex >= 0) {
            trades[editIndex] = trade;
        } else {
            trades.push(trade);
        }
        
        saveTrades();
        renderTradeList();
        updateStatistics();
        generateCalendar(new Date(trade.date));
        
        tradeForm.reset();
        document.getElementById('edit-index').value = "-1";
        document.getElementById('submit-btn').textContent = "Add Trade";
        document.getElementById('cancel-edit').style.display = "none";
    });
    
    document.getElementById('cancel-edit').addEventListener('click', function() {
        tradeForm.reset();
        document.getElementById('edit-index').value = "-1";
        document.getElementById('submit-btn').textContent = "Add Trade";
        this.style.display = "none";
    });
}

// Trade list functions
function renderTradeList() {
    const tradeEntries = document.getElementById('trade-entries');
    tradeEntries.innerHTML = '';
    
    const sortedTrades = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTrades.forEach((trade, index) => {
        const row = document.createElement('tr');
        const profit = trade.profit;
        const plColor = profit > 0 ? 'color: #2ecc71;' : profit < 0 ? 'color: #e74c3c;' : 'color: #95a5a6;';
        const plSign = profit > 0 ? '+' : '';
        
        row.innerHTML = `
            <td>${formatDate(trade.date)}</td>
            <td>${trade.pair}</td>
            <td>${trade.entry.toFixed(5)}</td>
            <td>${trade.exit.toFixed(5)}</td>
            <td style="${plColor}">${plSign}${profit.toFixed(2)}</td>
            <td>${capitalizeFirstLetter(trade.outcome.replace('-', ' '))}</td>
            <td>${capitalizeFirstLetter(trade.news.replace('-', ' '))}</td>
            <td class="actions">
                <button class="edit-btn" data-index="${index}">Edit</button>
                <button class="delete-btn" data-index="${index}">Delete</button>
            </td>
        `;
        
        tradeEntries.appendChild(row);
    });

    // Add event listeners for edit/delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            editTrade(index);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            deleteTrade(index);
        });
    });
}

function editTrade(index) {
    const trade = trades[index];
    document.getElementById('edit-index').value = index;
    document.getElementById('trade-date').value = trade.date;
    document.getElementById('currency-pair').value = trade.pair;
    document.getElementById('entry-price').value = trade.entry;
    document.getElementById('exit-price').value = trade.exit;
    document.getElementById('position-size').value = trade.size;
    document.getElementById('trade-outcome').value = trade.outcome;
    document.getElementById('news-impact').value = trade.news;
    document.getElementById('notes').value = trade.notes;
    
    document.getElementById('submit-btn').textContent = 'Update Trade';
    document.getElementById('cancel-edit').style.display = 'inline-block';
}

function deleteTrade(index) {
    if (confirm('Are you sure you want to delete this trade?')) {
        trades.splice(index, 1);
        saveTrades();
        renderTradeList();
        updateStatistics();
        generateCalendar(new Date());
    }
}

// Statistics functions
function updateStatistics() {
    if (trades.length === 0) {
        resetStatistics();
        return;
    }
    
    // Basic stats
    const winningTrades = trades.filter(t => t.outcome === 'win');
    const losingTrades = trades.filter(t => t.outcome === 'loss');
    const winRate = (winningTrades.length / trades.length) * 100;
    
    document.getElementById('win-rate').textContent = winRate.toFixed(1) + '%';
    
    // Average win/loss
    const avgWin = winningTrades.reduce((sum, trade) => sum + trade.profit, 0) / winningTrades.length || 0;
    const avgLoss = losingTrades.reduce((sum, trade) => sum + trade.profit, 0) / losingTrades.length || 0;
    
    document.getElementById('avg-win').textContent = avgWin.toFixed(2);
    document.getElementById('avg-loss').textContent = avgLoss.toFixed(2);
    
    // Profit factor
    const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.profit, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profit, 0));
    const profitFactor = totalLoss === 0 ? '∞' : (totalProfit / totalLoss).toFixed(2);
    
    document.getElementById('profit-factor').textContent = profitFactor;
    
    // News impact stats
    updateNewsStatistics();
    
    // Update charts
    updateCharts();
}

function resetStatistics() {
    document.getElementById('win-rate').textContent = '0%';
    document.getElementById('avg-win').textContent = '0';
    document.getElementById('avg-loss').textContent = '0';
    document.getElementById('profit-factor').textContent = '0';
    
    // Reset news stats
    document.getElementById('trades-with-news').textContent = '0';
    document.getElementById('win-rate-news').textContent = '0%';
    document.getElementById('win-rate-no-news').textContent = '0%';
    
    const newsLevels = ['none', 'low', 'medium', 'high'];
    newsLevels.forEach(level => {
        document.getElementById(`${level}-news-count`).textContent = '0';
        document.getElementById(`${level}-news-win-rate`).textContent = '0%';
        document.getElementById(`${level}-news-avg`).textContent = '0';
    });
}

function updateNewsStatistics() {
    const tradesWithNews = trades.filter(t => t.news !== 'none');
    const tradesNoNews = trades.filter(t => t.news === 'none');
    
    document.getElementById('trades-with-news').textContent = tradesWithNews.length;
    
    // Win rates
    const winRateWithNews = tradesWithNews.filter(t => t.outcome === 'win').length / tradesWithNews.length * 100 || 0;
    const winRateNoNews = tradesNoNews.filter(t => t.outcome === 'win').length / tradesNoNews.length * 100 || 0;
    
    document.getElementById('win-rate-news').textContent = winRateWithNews.toFixed(1) + '%';
    document.getElementById('win-rate-no-news').textContent = winRateNoNews.toFixed(1) + '%';
    
    // News impact breakdown
    const newsLevels = ['none', 'low', 'medium', 'high'];
    
    newsLevels.forEach(level => {
        const levelTrades = trades.filter(t => t.news === level);
        const levelWins = levelTrades.filter(t => t.outcome === 'win').length;
        const levelWinRate = levelTrades.length > 0 ? (levelWins / levelTrades.length * 100) : 0;
        const avgPL = levelTrades.reduce((sum, t) => sum + t.profit, 0) / levelTrades.length || 0;
        
        document.getElementById(`${level}-news-count`).textContent = levelTrades.length;
        document.getElementById(`${level}-news-win-rate`).textContent = levelWinRate.toFixed(1) + '%';
        document.getElementById(`${level}-news-avg`).textContent = avgPL.toFixed(2);
    });
}

// Chart functions
function updateCharts() {
    if (typeof Chart === 'undefined') return;
    
    // Performance over time chart
    updatePerformanceChart();
    
    // Outcome distribution chart
    updateOutcomeChart();
    
    // News impact chart
    updateNewsImpactChart();
}

function updatePerformanceChart() {
    const ctx = document.getElementById('performance-chart').getContext('2d');
    
    // Group trades by month
    const monthlyData = {};
    trades.forEach(trade => {
        const date = new Date(trade.date);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { profit: 0, trades: 0 };
        }
        
        monthlyData[monthYear].profit += trade.profit;
        monthlyData[monthYear].trades += 1;
    });
    
    const months = Object.keys(monthlyData).sort();
    const monthlyProfits = months.map(m => monthlyData[m].profit);
    
    // Destroy previous chart if exists
    if (window.performanceChart) {
        window.performanceChart.destroy();
    }
    
    window.performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Monthly Profit/Loss',
                data: monthlyProfits,
                backgroundColor: monthlyProfits.map(p => p >= 0 ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)'),
                borderColor: monthlyProfits.map(p => p >= 0 ? 'rgba(46, 204, 113, 1)' : 'rgba(231, 76, 60, 1)'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Profit/Loss'
                    }
                }
            }
        }
    });
}

function updateOutcomeChart() {
    const ctx = document.getElementById('outcome-chart').getContext('2d');
    
    const outcomes = ['win', 'loss', 'break-even'];
    const outcomeCounts = outcomes.map(outcome => 
        trades.filter(t => t.outcome === outcome).length
    );
    
    // Destroy previous chart if exists
    if (window.outcomeChart) {
        window.outcomeChart.destroy();
    }
    
    window.outcomeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: outcomes.map(o => capitalizeFirstLetter(o.replace('-', ' '))),
            datasets: [{
                data: outcomeCounts,
                backgroundColor: [
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(231, 76, 60, 0.7)',
                    'rgba(149, 165, 166, 0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function updateNewsImpactChart() {
    const ctx = document.getElementById('news-impact-chart').getContext('2d');
    
    const newsLevels = ['none', 'low', 'medium', 'high'];
    const newsLabels = ['No News', 'Low Impact', 'Medium Impact', 'High Impact'];
    const newsCounts = newsLevels.map(level => 
        trades.filter(t => t.news === level).length
    );
    
    // Destroy previous chart if exists
    if (window.newsImpactChart) {
        window.newsImpactChart.destroy();
    }
    
    window.newsImpactChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: newsLabels,
            datasets: [{
                data: newsCounts,
                backgroundColor: [
                    'rgba(149, 165, 166, 0.7)',
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(243, 156, 18, 0.7)',
                    'rgba(231, 76, 60, 0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// P/L Calendar functions
function setupCalendar() {
    document.getElementById('prev-month').addEventListener('click', function() {
        const currentMonth = document.getElementById('current-month').textContent;
        const date = new Date(currentMonth + ' 1, 2000');
        date.setMonth(date.getMonth() - 1);
        generateCalendar(date);
    });
    
    document.getElementById('next-month').addEventListener('click', function() {
        const currentMonth = document.getElementById('current-month').textContent;
        const date = new Date(currentMonth + ' 1, 2000');
        date.setMonth(date.getMonth() + 1);
        generateCalendar(date);
    });
}

function generateCalendar(date) {
    const calendarEl = document.getElementById('pl-calendar');
    calendarEl.innerHTML = '';
    
    // Set current month header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('current-month').textContent = 
        `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    
    // Get first day of month and total days
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Get day of week for first day (0 = Sunday, 6 = Saturday)
    let startingDay = firstDay.getDay();
    
    // Create day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        calendarEl.appendChild(dayHeader);
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarEl.appendChild(emptyCell);
    }
    
    // Create cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);
        
        // Check if there are trades for this day
        const currentDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayTrades = trades.filter(t => t.date === currentDate);
        
        if (dayTrades.length > 0) {
            // Calculate net P/L for the day
            const netPL = dayTrades.reduce((sum, trade) => sum + trade.profit, 0);
            
            const plIndicator = document.createElement('div');
            plIndicator.className = 'pl-indicator';
            
            if (netPL > 0) {
                plIndicator.classList.add('profit');
                plIndicator.textContent = `+${netPL.toFixed(2)}`;
            } else if (netPL < 0) {
                plIndicator.classList.add('loss');
                plIndicator.textContent = netPL.toFixed(2);
            } else {
                plIndicator.classList.add('neutral');
                plIndicator.textContent = '0.00';
            }
            
            // Add trade count
            const tradeCount = document.createElement('small');
            tradeCount.textContent = `${dayTrades.length} trade${dayTrades.length > 1 ? 's' : ''}`;
            plIndicator.appendChild(document.createElement('br'));
            plIndicator.appendChild(tradeCount);
            
            dayCell.appendChild(plIndicator);
        }
        
        calendarEl.appendChild(dayCell);
    }
}

// Excel import/export functions
function setupExcelFeatures() {
    document.getElementById('export-btn').addEventListener('click', exportToExcel);
    document.getElementById('import-btn').addEventListener('click', function() {
        document.getElementById('file-input').click();
    });
    
    document.getElementById('file-input').addEventListener('change', importFromExcel);
}

function exportToExcel() {
    if (trades.length === 0) {
        alert('No trades to export!');
        return;
    }
    
    // Format data for Excel
    const exportData = trades.map(trade => ({
        'Date': trade.date,
        'Currency Pair': trade.pair,
        'Entry Price': trade.entry,
        'Exit Price': trade.exit,
        'Position Size': trade.size,
        'Outcome': trade.outcome,
        'Profit/Loss': trade.profit,
        'News Impact': trade.news,
        'Notes': trade.notes || ''
    }));
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trading Journal");
    
    // Export to file
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Trading_Journal_${date}.xlsx`);
}

function importFromExcel(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get data from first sheet
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length === 0) {
                alert('File is empty or format is incorrect!');
                return;
            }
            
            // Confirm before import
            if (!confirm(`Import ${jsonData.length} trades? This will overwrite current data!`)) {
                return;
            }
            
            // Format imported data
            const importedTrades = jsonData.map(item => {
                // Calculate profit if not provided
                let profit = item['Profit/Loss'] || item['profit_loss'];
                if (profit === undefined) {
                    const pair = item['Currency Pair'] || item['currency_pair'] || 'EUR/USD';
                    profit = calculateProfit(
                        parseFloat(item['Entry Price'] || item['entry_price']),
                        parseFloat(item['Exit Price'] || item['exit_price']),
                        parseFloat(item['Position Size'] || item['position_size']),
                        pair
                    );
                }
                
                return {
                    date: item['Date'] || item['date'],
                    pair: item['Currency Pair'] || item['currency_pair'],
                    entry: parseFloat(item['Entry Price'] || item['entry_price']),
                    exit: parseFloat(item['Exit Price'] || item['exit_price']),
                    size: parseFloat(item['Position Size'] || item['position_size']),
                    outcome: item['Outcome'] || item['outcome'] || 'break-even',
                    profit: parseFloat(profit),
                    news: item['News Impact'] || item['news_impact'] || 'none',
                    notes: item['Notes'] || item['notes'] || ''
                };
            });
            
            // Save imported data
            trades = importedTrades;
            saveTrades();
            renderTradeList();
            updateStatistics();
            generateCalendar(new Date());
            
            alert('Import successful!');
        } catch (error) {
            console.error('Import error:', error);
            alert('Error importing file. Please check the format.');
        }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset input file
    e.target.value = '';
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Tab functions
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            // Update charts if needed
            if (tabId === 'statistics') {
                updateCharts();
            }
        });
    });
}
