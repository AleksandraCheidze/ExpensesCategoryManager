// Display the generated report
function displayReport(data) {
    console.log('Displaying report with data:', data);
    
    // Check if report results container exists
    if (!reportResults) {
        console.error('Report results container not found!');
        return;
    }
    
    // Clear previous loading indicator
    reportResults.innerHTML = `
        <div id="chart-container">
            <canvas id="report-chart"></canvas>
        </div>
        <div id="report-summary"></div>
    `;
    
    // Create and display chart
    createReportChart(data);
    
    // Create and display summary
    createReportSummary(data);
}
