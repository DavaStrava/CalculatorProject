document.addEventListener('DOMContentLoaded', function() {
    // Replace with your actual API Gateway URL
    const apiUrl = 'https://927lg8a0al.execute-api.us-west-2.amazonaws.com/v1/Scan_and_sum_Dynamo1'; 

    // Fetch the total number of calculations
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Display the total number of calculations in the UI
            document.getElementById('calculation-count').textContent = `This website has been used to perform ${data.total_calculations} calculations.`;
        })
        .catch(error => {
            console.error('Error fetching total calculations:', error);
            document.getElementById('calculation-count').textContent = 'Error loading calculation count.';
        });
});
