const { PDFDocument, rgb, StandardFonts } = PDFLib;

// Global error handler for PDF generation
window.addEventListener('error', function(e) {
    console.error('PDF Generation Error:', e.error);
    alert('Error generating PDF: ' + (e.error?.message || 'Unknown error'));
});

async function generateLeavePDF(leaveData) {
    try {
        // Show loading state
        const downloadBtn = document.querySelector('.download-approval:focus');
        if (downloadBtn) {
            const originalText = downloadBtn.innerHTML;
            downloadBtn.innerHTML = 'Generating...';
            downloadBtn.style.pointerEvents = 'none';
            
            // Reset button state after a delay if something goes wrong
            setTimeout(() => {
                downloadBtn.innerHTML = originalText;
                downloadBtn.style.pointerEvents = '';
            }, 5000);
        }

        // Fetch the PDF template
        const url = 'download_approval/leave.pdf';
        console.log('Fetching PDF template from:', url);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF template: ${response.status} ${response.statusText}`);
        }
        const existingPdfBytes = await response.arrayBuffer();

        // Load the PDF document
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Format date for display (DD-MMM-YYYY)
        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
        };

        // Wardens and Hostels mapping
        const wardens = ['Rajesh Kumar', 'Srinivas Appari', 'Nitin Chaturvedi', 'Krishnendra Shekhawat', 
                        'Prof. Rakhee and Meghana Tare', 'Kumar Sankar Bhattacharya', 'Praveen Kumar A.V.', 
                        'MM Pandey', 'Prof. Trilok Mathur'];
        const hostels = ['Srinivasa Ramanujan Bhawan', 'Krishna Bhawan', 'Gandhi Bhawan', 'Vishwakarma Bhawan', 
                        'Meera Bhawan', 'Shankar Bhawan', 'Vyas Bhawan', 'Ram Bhawan', 'Budh Bhawan'];

        const wardenIndex = hostels.indexOf(leaveData.hostel);
        const warden = wardenIndex >= 0 ? wardens[wardenIndex] : 'Warden';

        // Draw text on PDF with error handling
        const drawText = (text, y) => {
            try {
                firstPage.drawText(text || '', {
                    x: 302,
                    y,
                    size: 12.2,
                    font: helveticaFont,
                    color: rgb(0, 0, 0)
                });
            } catch (e) {
                console.error(`Error drawing text at y=${y}:`, e);
            }
        };

        // Fill in the form fields with proper error handling
        try {
            // Student Details
            drawText(leaveData.idno || 'N/A', 710);  // ID
            drawText(leaveData.name || 'N/A', 688);   // Name
            drawText(leaveData.contact || '6306808649', 667); // Contact (not in current form)
            drawText(leaveData.hostel || 'N/A', 647); // Hostel
            drawText(leaveData.room || 'N/A', 627);   // Room
            drawText(warden, 607);                    // Warden
            drawText(formatDate(leaveData.dept), 587); // Departure
            drawText(formatDate(leaveData.ret), 567);  // Return

            // Save and trigger download
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `leave-approval-${leaveData.idno || 'unknown'}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                if (downloadBtn) {
                    downloadBtn.innerHTML = 'Download Leave Approval';
                    downloadBtn.style.pointerEvents = '';
                }
            }, 100);
            
        } catch (error) {
            console.error('Error in PDF generation:', error);
            throw new Error('Failed to generate PDF: ' + error.message);
        }
    } catch (error) {
        console.error('PDF Generation Error:', error);
        alert('Error generating PDF: ' + (error.message || 'Unknown error'));
        throw error; // Re-throw to be caught by the global error handler
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
}

// Function to handle download button click
function setupDownloadButton(button, leaveData) {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        generateLeavePDF(leaveData);
    });
}

// Export the functions
window.LeaveApproval = {
    generateLeavePDF,
    setupDownloadButton
};
