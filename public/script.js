// Data storage
let trades = JSON.parse(localStorage.getItem('trades')) || [];

// DOM elements
const tradeForm = document.getElementById('trade-form');
const tradeEntries = document.getElementById('trade-entries');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Load trades
    renderTradeList();
    updateStatistics();
    generateCalendar(new Date());
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            // If statistics tab is activated, update charts
            if (tabId === 'statistics') {
                updateCharts();
            }
        });
    });
    
    // Calendar navigation
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
    
    // Form submission
    tradeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const trade = {
            date: document.getElementById('trade-date').value,
            pair: document.getElementById('currency-pair').value,
            entry: parseFloat(document.getElementById('entry-price').value),
            exit: parseFloat(document.getElementById('exit-price').value),
            size: parseFloat(document.getElementById('position-size').value),
            outcome: document.getElementById('trade-outcome').value,
            emotion: document.getElementById('emotion').value,
            news: document.getElementById('news-impact').value,
            notes: document.getElementById('notes').value,
            profit: calculateProfit(
                parseFloat(document.getElementById('entry-price').value),
                parseFloat(document.getElementById('exit-price').value),
                parseFloat(document.getElementById('position-size').value),
                document.getElementById('currency-pair').value
            )
        };
        
        trades.push(trade);
        saveTrades();
        renderTradeList();
        updateStatistics();
        generateCalendar(new Date(trade.date));
        
        // Reset form
        this.reset();
    });
});

// Calculate profit based on currency pair
function calculateProfit(entry, exit, size, pair) {
    const isPipPair = pair.includes('JPY');
    const pips = (exit - entry) * (isPipPair ? 100 : 10000);
    return pips * size;
}

// Save trades to localStorage
function saveTrades() {
    localStorage.setItem('trades', JSON.stringify(trades));
}

// Render trade list
function renderTradeList() {
    tradeEntries.innerHTML = '';
    
    // Sort trades by date (newest first)
    const sortedTrades = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTrades.forEach(trade => {
        const row = document.createElement('tr');
        
        // Determine profit/loss color
        const profit = trade.profit;
        const plColor = profit >= 0 ? 'color: #2ecc71;' : 'color: #e74c3c;';
        const plSign = profit >= 0 ? '+' : '';
        
        row.innerHTML = `
            <td>${formatDate(trade.date)}</td>
            <td>${trade.pair}</td>
            <td>${trade.entry.toFixed(5)}</td>
            <td>${trade.exit.toFixed(5)}</td>
            <td style="${plColor}">${plSign}${profit.toFixed(2)}</td>
            <td><span class="color-sample ${trade.emotion}"></span> ${capitalizeFirstLetter(trade.emotion)}</td>
            <td>${capitalizeFirstLetter(trade.news.replace('-', ' '))}</td>
        `;
        
        tradeEntries.appendChild(row);
    });
}

// Update statistics
function updateStatistics() {
    if (trades.length === 0) return;
    
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

// Update news statistics
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

// Update charts
function updateCharts() {
    if (typeof Chart === 'undefined') return;
    
    // Performance over time
    const performanceCtx = document.getElementById('performance-chart').getContext('2d');
    
    // Group trades by month
    const monthlyData = {};
    trades.forEach(trade => {
        const date = new Date(trade.date);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
                profit: 0,
                wins: 0,
                losses: 0,
                trades: 0
            };
        }
        
        monthlyData[monthYear].profit += trade.profit;
        monthlyData[monthYear].trades += 1;
        
        if (trade.outcome === 'win') {
            monthlyData[monthYear].wins += 1;
        } else if (trade.outcome === 'loss') {
            monthlyData[monthYear].losses += 1;
        }
    });
    
    const months = Object.keys(monthlyData).sort();
    const monthlyProfits = months.map(m => monthlyData[m].profit);
    const monthlyWinRates = months.map(m => (monthlyData[m].wins / monthlyData[m].trades) * 100);
    
    new Chart(performanceCtx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Profit',
                    data: monthlyProfits,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Win Rate %',
                    data: monthlyWinRates,
                    type: 'line',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(46, 204, 113, 1)',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Profit'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Win Rate %'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
    
    // Emotion distribution
    const emotionCtx = document.getElementById('emotion-chart').getContext('2d');
    
    const emotions = ['happy', 'anxious', 'fearful', 'greedy', 'frustrated', 'neutral'];
    const emotionCounts = emotions.map(emotion => 
        trades.filter(t => t.emotion === emotion).length
    );
    
    new Chart(emotionCtx, {
        type: 'doughnut',
        data: {
            labels: emotions.map(e => capitalizeFirstLetter(e)),
            datasets: [{
                data: emotionCounts,
                backgroundColor: [
                    '#2ecc71', // happy
                    '#f39c12', // anxious
                    '#e74c3c', // fearful
                    '#9b59b6', // greedy
                    '#34495e', // frustrated
                    '#95a5a6'  // neutral
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
    
    // News impact distribution
    const newsCtx = document.getElementById('news-impact-chart').getContext('2d');
    
    const newsLevels = ['none', 'low', 'medium', 'high'];
    const newsLabels = ['No News', 'Low Impact', 'Medium Impact', 'High Impact'];
    const newsCounts = newsLevels.map(level => 
        trades.filter(t => t.news === level).length
    );
    
    new Chart(newsCtx, {
        type: 'pie',
        data: {
            labels: newsLabels,
            datasets: [{
                data: newsCounts,
                backgroundColor: [
                    '#95a5a6', // none
                    '#3498db', // low
                    '#f39c12', // medium
                    '#e74c3c'  // high
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

// Generate emotional calendar
function generateCalendar(date) {
    const calendarEl = document.getElementById('emotional-calendar');
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
            // Get dominant emotion for the day
            const emotionCounts = {};
            dayTrades.forEach(trade => {
                emotionCounts[trade.emotion] = (emotionCounts[trade.emotion] || 0) + 1;
            });
            
            const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
                emotionCounts[a] > emotionCounts[b] ? a : b
            );
            
            const emotionIndicator = document.createElement('div');
            emotionIndicator.className = `emotion-indicator ${dominantEmotion}`;
            
            // Add trade count to indicator
            const tradeCount = document.createElement('div');
            tradeCount.textContent = `${dayTrades.length} trade${dayTrades.length > 1 ? 's' : ''}`;
            emotionIndicator.appendChild(tradeCount);
            
            // Add net P/L if available
            const netPL = dayTrades.reduce((sum, trade) => sum + trade.profit, 0);
            if (netPL !== 0) {
                const plElement = document.createElement('div');
                plElement.textContent = netPL > 0 ? `+${netPL.toFixed(2)}` : netPL.toFixed(2);
                plElement.style.fontWeight = 'bold';
                plElement.style.color = netPL >= 0 ? '#2ecc71' : '#e74c3c';
                emotionIndicator.appendChild(plElement);
            }
            
            dayCell.appendChild(emotionIndicator);
        }
        
        calendarEl.appendChild(dayCell);
    }
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Load Chart.js dynamically if not already loaded
function loadChartJS() {
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = updateCharts;
        document.head.appendChild(script);
    }
}

// Initialize Chart.js
loadChartJS();
