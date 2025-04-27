// Calendar functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Setting up calendar functionality');

    // Initialize datepickers
    initDatepickers();

    // Format date for input fields (MM/DD/YYYY)
    function formatDateForInput(date) {
        if (!(date instanceof Date)) {
            console.error('formatDateForInput expects a Date object');
            return '';
        }

        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${month}/${day}/${year}`;
    }

    // Initialize custom datepickers
    function initDatepickers() {
        console.log('Initializing datepickers');

        document.querySelectorAll('.datepicker-input').forEach(input => {
            console.log('Setting up datepicker for:', input.id);

            // Create a container for the calendar if it doesn't exist
            let calendarContainer = document.getElementById(`calendar-${input.id}`);
            if (!calendarContainer) {
                calendarContainer = document.createElement('div');
                calendarContainer.id = `calendar-${input.id}`;
                calendarContainer.className = 'calendar-container';
                // Add to the end of body instead of inside the parent element
                document.body.appendChild(calendarContainer);
                console.log('Created calendar container for:', input.id);
            }

            // Initialize with current date if empty
            let currentDate;
            if (input.value) {
                const normalizedDate = normalizeDate(input.value);
                currentDate = new Date(normalizedDate);
                if (isNaN(currentDate.getTime())) {
                    currentDate = new Date();
                }
            } else {
                currentDate = new Date();
                // Set the input value to the current date in the correct format
                input.value = formatDateForInput(currentDate);
            }

            console.log(`Initial date for ${input.id}:`, currentDate, 'formatted as:', input.value);

            // Add click event to show calendar
            input.addEventListener('click', function(event) {
                event.stopPropagation();

                console.log(`Clicked on ${input.id}`);

                // Close any other open calendars
                document.querySelectorAll('.calendar-container').forEach(container => {
                    if (container !== calendarContainer) {
                        container.style.display = 'none';
                    }
                });

                // Check if we need to update currentDate from input
                if (this.value) {
                    const normalizedDate = normalizeDate(this.value);
                    const dateFromInput = new Date(normalizedDate);
                    if (!isNaN(dateFromInput.getTime())) {
                        currentDate = dateFromInput;
                        console.log(`Updated current date from input to:`, currentDate);
                    }
                }

                // Position the calendar relative to the input field
                const rect = input.getBoundingClientRect();
                calendarContainer.style.position = 'fixed';
                calendarContainer.style.top = `${rect.bottom + window.scrollY}px`;
                calendarContainer.style.left = `${rect.left + window.scrollX}px`;
                calendarContainer.style.width = `${Math.max(300, rect.width)}px`;

                // Update calendar and display
                renderCalendar(calendarContainer, currentDate, function(date) {
                    currentDate = date;
                    input.value = formatDateForInput(date);
                    calendarContainer.style.display = 'none';
                    console.log(`Selected date:`, date, 'formatted as:', input.value);
                });

                // Show the calendar
                calendarContainer.style.display = 'block';
                console.log(`Showing calendar for ${input.id} at position:`, {
                    top: calendarContainer.style.top,
                    left: calendarContainer.style.left,
                    width: calendarContainer.style.width
                });
            });

            // Close calendar when clicking outside
            document.addEventListener('click', function(event) {
                if (!calendarContainer.contains(event.target) && event.target !== input) {
                    calendarContainer.style.display = 'none';
                    console.log(`Hiding calendar for ${input.id} (clicked outside)`);
                }
            });
        });
    }

    // Render calendar
    function renderCalendar(container, date, onDateSelected) {
        console.log('Rendering calendar for date:', date);

        // Clear container
        container.innerHTML = '';

        // Get current month and year
        const currentMonth = date.getMonth();
        const currentYear = date.getFullYear();
        const today = new Date();

        // Create calendar header
        const header = document.createElement('div');
        header.className = 'calendar-header';
        container.appendChild(header);

        // Add prev month button
        const prevMonthBtn = document.createElement('button');
        prevMonthBtn.innerHTML = '&lt;';
        prevMonthBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent event bubbling
            const newDate = new Date(currentYear, currentMonth - 1, 1);
            renderCalendar(container, newDate, onDateSelected);
            console.log('Switched to previous month:', newDate);
        });
        header.appendChild(prevMonthBtn);

        // Add month and year with year selection
        const monthYearContainer = document.createElement('div');
        monthYearContainer.className = 'month-year-container';
        header.appendChild(monthYearContainer);

        // Add month display
        const monthDisplay = document.createElement('div');
        monthDisplay.className = 'month-display';
        // Force English locale for month names
        monthDisplay.textContent = new Date(currentYear, currentMonth, 1).toLocaleString('en-US', { month: 'long' });
        monthYearContainer.appendChild(monthDisplay);

        // Add year selector
        const yearSelector = document.createElement('div');
        yearSelector.className = 'year-selector';
        monthYearContainer.appendChild(yearSelector);

        // Add year navigation buttons and display
        const prevYearBtn = document.createElement('button');
        prevYearBtn.className = 'year-nav-btn';
        prevYearBtn.innerHTML = '&lt;';
        prevYearBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent event bubbling
            const newDate = new Date(currentYear - 1, currentMonth, 1);
            renderCalendar(container, newDate, onDateSelected);
            console.log('Switched to previous year:', newDate);
        });
        yearSelector.appendChild(prevYearBtn);

        const yearDisplay = document.createElement('span');
        yearDisplay.className = 'year-display';
        yearDisplay.textContent = currentYear;
        yearSelector.appendChild(yearDisplay);

        const nextYearBtn = document.createElement('button');
        nextYearBtn.className = 'year-nav-btn';
        nextYearBtn.innerHTML = '&gt;';
        nextYearBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent event bubbling
            const newDate = new Date(currentYear + 1, currentMonth, 1);
            renderCalendar(container, newDate, onDateSelected);
            console.log('Switched to next year:', newDate);
        });
        yearSelector.appendChild(nextYearBtn);

        // Add next month button
        const nextMonthBtn = document.createElement('button');
        nextMonthBtn.innerHTML = '&gt;';
        nextMonthBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent event bubbling
            const newDate = new Date(currentYear, currentMonth + 1, 1);
            renderCalendar(container, newDate, onDateSelected);
            console.log('Switched to next month:', newDate);
        });
        header.appendChild(nextMonthBtn);

        // Create weekdays header
        const weekdaysRow = document.createElement('div');
        weekdaysRow.className = 'weekdays';
        // English weekday abbreviations
        const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        weekdays.forEach(day => {
            const dayElem = document.createElement('div');
            dayElem.textContent = day;
            weekdaysRow.appendChild(dayElem);
        });
        container.appendChild(weekdaysRow);

        // Create days grid
        const daysGrid = document.createElement('div');
        daysGrid.className = 'days';
        container.appendChild(daysGrid);

        // Get first day of month
        const firstDay = new Date(currentYear, currentMonth, 1);
        let firstDayIndex = firstDay.getDay() - 1; // Monday is 0
        if (firstDayIndex < 0) firstDayIndex = 6; // Sunday is 6

        // Get last day of month
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day empty';
            daysGrid.appendChild(emptyDay);
        }

        // Add days of month
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElem = document.createElement('div');
            dayElem.className = 'day';
            dayElem.textContent = i;

            // Highlight today
            if (currentYear === today.getFullYear() && currentMonth === today.getMonth() && i === today.getDate()) {
                dayElem.classList.add('today');
            }

            // Highlight selected date
            if (currentYear === date.getFullYear() && currentMonth === date.getMonth() && i === date.getDate()) {
                dayElem.classList.add('selected');
            }

            // Add click event
            dayElem.addEventListener('click', function(event) {
                event.stopPropagation(); // Prevent event bubbling
                const selectedDate = new Date(currentYear, currentMonth, i);
                console.log('Selected day:', i, 'month:', currentMonth + 1, 'year:', currentYear);
                onDateSelected(selectedDate);
            });

            daysGrid.appendChild(dayElem);
        }
    }

    // Helper function to normalize date string to YYYY-MM-DD format
    function normalizeDate(input) {
        // Check if normalizeDate is defined in the global scope
        if (window.normalizeDate && typeof window.normalizeDate === 'function') {
            return window.normalizeDate(input);
        }
        if (!input) return '';

        // Check if already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            return input;
        }

        // Try MM/DD/YYYY format
        const mmddyyyyMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (mmddyyyyMatch) {
            const month = mmddyyyyMatch[1].padStart(2, '0');
            const day = mmddyyyyMatch[2].padStart(2, '0');
            const year = mmddyyyyMatch[3];
            return `${year}-${month}-${day}`;
        }

        // Try DD.MM.YYYY format
        const ddmmyyyyMatch = input.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (ddmmyyyyMatch) {
            const day = ddmmyyyyMatch[1].padStart(2, '0');
            const month = ddmmyyyyMatch[2].padStart(2, '0');
            const year = ddmmyyyyMatch[3];
            return `${year}-${month}-${day}`;
        }

        // Try standard date parsing as fallback
        try {
            const date = new Date(input);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch (e) {
            console.error('Error parsing date:', input, e);
        }

        console.error('Failed to normalize date:', input);
        return input; // Return original input if parsing fails
    }
});
