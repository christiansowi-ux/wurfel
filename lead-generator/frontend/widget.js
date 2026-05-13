(function() {
    // Styles
    const style = document.createElement('style');
    style.textContent = `
        #lg-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            font-family: Arial, sans-serif;
        }
        #lg-widget-button {
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 50px;
            padding: 12px 24px;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            font-size: 16px;
        }
        #lg-widget-form {
            display: none;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            width: 300px;
            margin-bottom: 10px;
            border: 1px solid #eee;
        }
        #lg-widget-form h3 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 18px;
            color: #333;
        }
        #lg-widget-form input {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
        }
        #lg-widget-form button {
            width: 100%;
            padding: 10px;
            background-color: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        #lg-widget-form button:hover {
            background-color: #218838;
        }
        #lg-widget-message {
            margin-top: 10px;
            font-size: 14px;
            display: none;
        }
        .lg-success { color: green; }
        .lg-error { color: red; }
    `;
    document.head.appendChild(style);

    // Create HTML
    const container = document.createElement('div');
    container.id = 'lg-widget-container';
    
    container.innerHTML = `
        <div id="lg-widget-form">
            <h3>Get in touch!</h3>
            <input type="text" id="lg-name" placeholder="Your Name" required>
            <input type="email" id="lg-email" placeholder="Your Email" required>
            <button id="lg-submit">Submit</button>
            <div id="lg-widget-message"></div>
        </div>
        <button id="lg-widget-button">Contact Us</button>
    `;
    document.body.appendChild(container);

    // Elements
    const form = document.getElementById('lg-widget-form');
    const button = document.getElementById('lg-widget-button');
    const submitBtn = document.getElementById('lg-submit');
    const nameInput = document.getElementById('lg-name');
    const emailInput = document.getElementById('lg-email');
    const msgDiv = document.getElementById('lg-widget-message');

    // API URL - should be configurable, defaulting to localhost for this environment
    let API_URL = window.LG_WIDGET_API_URL || 'https://smooth-foxes-fold.loca.lt/api/leads';

    // Handle dynamic API URL for sandbox preview environments if localtunnel is not used
    if (!API_URL.includes('loca.lt') && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.LG_WIDGET_API_URL) {
        // If we detect we are in a sandbox environment (via the port prefix), adjust the URL
        if (window.location.origin.includes('8080-')) {
            API_URL = window.location.origin.replace('8080-', '3000-') + '/api/leads';
        }
    }

    // Toggle form
    button.addEventListener('click', () => {
        const isVisible = form.style.display === 'block';
        form.style.display = isVisible ? 'none' : 'block';
        button.textContent = isVisible ? 'Contact Us' : 'Close';
    });

    // Handle Submit
    submitBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        if (!name || !email) {
            showMessage('Please fill in all fields.', 'lg-error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email }),
            });

            if (response.ok) {
                showMessage('Thank you! We will be in touch.', 'lg-success');
                nameInput.value = '';
                emailInput.value = '';
                setTimeout(() => {
                    form.style.display = 'none';
                    button.textContent = 'Contact Us';
                    msgDiv.style.display = 'none';
                }, 3000);
            } else {
                const data = await response.json();
                showMessage(data.error || 'Something went wrong.', 'lg-error');
            }
        } catch (error) {
            showMessage('Could not connect to server.', 'lg-error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
        }
    });

    function showMessage(text, className) {
        msgDiv.textContent = text;
        msgDiv.className = className;
        msgDiv.style.display = 'block';
    }
})();
