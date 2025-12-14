import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PrescriptionData {
    appointmentId: string
    appointmentDate: string
    serialNumber: number | null
    doctor: {
        name: string
        specialization: string
        qualifications?: string
        registrationNumber?: string
    }
    patient: {
        name: string
        age?: number
        gender?: string
    }
    medicines: Array<{
        medicine_name: string
        dosage_quantity: string | null
        dosage_unit: string | null
        meal_timing: string | null
        frequency_type: string | null
        morning: boolean | null
        afternoon: boolean | null
        night: boolean | null
        hours_gap: number | null
        duration_days: number | null
        instructions: string | null
    }>
    tests: Array<{
        test_name: string
        test_description: string | null
        instructions: string | null
    }>
    referrals: Array<{
        specialty: string
        reason: string | null
        notes: string | null
    }>
}

export function generatePrescriptionPDF(data: PrescriptionData) {
    const doc = new jsPDF()
    let yPos = 20

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('MEDICAL PRESCRIPTION', 105, yPos, { align: 'center' })
    yPos += 10

    // Doctor Information
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Dr. ${data.doctor.name}`, 105, yPos, { align: 'center' })
    yPos += 6

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(data.doctor.specialization, 105, yPos, { align: 'center' })
    yPos += 5

    if (data.doctor.qualifications) {
        doc.text(data.doctor.qualifications, 105, yPos, { align: 'center' })
        yPos += 5
    }

    if (data.doctor.registrationNumber) {
        doc.text(`Reg. No: ${data.doctor.registrationNumber}`, 105, yPos, { align: 'center' })
        yPos += 5
    }

    // Line separator
    yPos += 5
    doc.setLineWidth(0.5)
    doc.line(20, yPos, 190, yPos)
    yPos += 10

    // Patient Information
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Patient Information:', 20, yPos)
    yPos += 6

    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${data.patient.name}`, 20, yPos)
    yPos += 5

    if (data.patient.age || data.patient.gender) {
        const patientDetails = []
        if (data.patient.age) patientDetails.push(`Age: ${data.patient.age}`)
        if (data.patient.gender) patientDetails.push(`Gender: ${data.patient.gender}`)
        doc.text(patientDetails.join(' | '), 20, yPos)
        yPos += 5
    }

    doc.text(`Date: ${new Date(data.appointmentDate).toLocaleDateString()}`, 20, yPos)
    if (data.serialNumber) {
        doc.text(`Serial No: #${data.serialNumber}`, 120, yPos)
    }
    yPos += 10

    // Rx Symbol
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('Rx', 20, yPos)
    yPos += 10

    // Medicines
    if (data.medicines.length > 0) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Prescribed Medicines:', 20, yPos)
        yPos += 8

        const medicineRows = data.medicines.map((med, index) => {
            // Build dosage string
            let dosage = ''
            if (med.dosage_quantity && med.dosage_unit) {
                dosage = `${med.dosage_quantity} ${med.dosage_unit}`
            }

            // Build frequency string
            let frequency = ''
            if (med.frequency_type === 'specific_times') {
                const times = []
                if (med.morning) times.push('Morning')
                if (med.afternoon) times.push('Afternoon')
                if (med.night) times.push('Night')
                frequency = times.join(', ')
            } else if (med.frequency_type === 'hours_gap' && med.hours_gap) {
                frequency = `Every ${med.hours_gap} hours`
            }

            // Build meal timing
            let mealTiming = ''
            if (med.meal_timing) {
                const timingMap: Record<string, string> = {
                    'after_meal': 'After meal',
                    'before_meal': 'Before meal',
                    'with_meal': 'With meal',
                    'empty_stomach': 'Empty stomach'
                }
                mealTiming = timingMap[med.meal_timing] || med.meal_timing
            }

            const duration = med.duration_days ? `${med.duration_days} days` : ''
            const instructions = med.instructions || ''

            return [
                index + 1,
                med.medicine_name,
                dosage,
                frequency,
                mealTiming,
                duration,
                instructions
            ]
        })

        autoTable(doc, {
            startY: yPos,
            head: [['#', 'Medicine', 'Dosage', 'Frequency', 'Timing', 'Duration', 'Instructions']],
            body: medicineRows,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 35 },
                2: { cellWidth: 25 },
                3: { cellWidth: 30 },
                4: { cellWidth: 25 },
                5: { cellWidth: 20 },
                6: { cellWidth: 35 }
            }
        })

        yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Tests
    if (data.tests.length > 0) {
        // Check if we need a new page
        if (yPos > 250) {
            doc.addPage()
            yPos = 20
        }

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Prescribed Tests:', 20, yPos)
        yPos += 8

        const testRows = data.tests.map((test, index) => [
            index + 1,
            test.test_name,
            test.test_description || '',
            test.instructions || ''
        ])

        autoTable(doc, {
            startY: yPos,
            head: [['#', 'Test Name', 'Description', 'Instructions']],
            body: testRows,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 60 },
                2: { cellWidth: 60 },
                3: { cellWidth: 50 }
            }
        })

        yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Referrals
    if (data.referrals.length > 0) {
        // Check if we need a new page
        if (yPos > 250) {
            doc.addPage()
            yPos = 20
        }

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Referrals:', 20, yPos)
        yPos += 8

        data.referrals.forEach((referral, index) => {
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text(`${index + 1}. Refer to: ${referral.specialty}`, 25, yPos)
            yPos += 5

            doc.setFont('helvetica', 'normal')
            if (referral.reason) {
                doc.text(`Reason: ${referral.reason}`, 30, yPos)
                yPos += 5
            }
            if (referral.notes) {
                doc.text(`Notes: ${referral.notes}`, 30, yPos)
                yPos += 5
            }
            yPos += 3
        })
        yPos += 5
    }

    // Signature area
    if (yPos > 240) {
        doc.addPage()
        yPos = 20
    }

    yPos = Math.max(yPos, 240)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('_______________________', 140, yPos)
    yPos += 5
    doc.text("Doctor's Signature", 140, yPos)

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text('This is a computer-generated prescription', 105, 285, { align: 'center' })

    // Save PDF
    const fileName = `Prescription_${data.patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
}
