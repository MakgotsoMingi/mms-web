import React, { useState, useMemo } from 'react';
import {
  saveBooking,
  getBookings,
  logClientInteraction,
  isAdvanceBookingRequired,
  getAllowedAdvanceDateRange,
  pushNotification
} from '../utlis/storage';
import '../styles/directory.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toIsoDate(year, monthIndex, day) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function buildMonthCells(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(toIsoDate(year, monthIndex, d));
  }
  return cells;
}

function BookingPage({ provider, user, onBack, onBookingComplete }) {
  const needsAdvance = isAdvanceBookingRequired(provider.category);
  const { minDate, maxDate } = getAllowedAdvanceDateRange();
  const todayIso = toIsoDate(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );

  const initialDate =
    provider.workingDays?.find((d) =>
      needsAdvance ? d >= minDate && d <= maxDate : d >= todayIso
    ) || (needsAdvance ? minDate : todayIso);

  const parsedInitial = new Date(`${initialDate}T00:00:00`);
  const [calYear, setCalYear] = useState(
    Number.isNaN(parsedInitial.getTime()) ? new Date().getFullYear() : parsedInitial.getFullYear()
  );
  const [calMonth, setCalMonth] = useState(
    Number.isNaN(parsedInitial.getTime()) ? new Date().getMonth() : parsedInitial.getMonth()
  );

  const [selectedService, setSelectedService] = useState(provider.services?.[0] || 'Standard Service');
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlot, setSelectedSlot] = useState(provider.timeSlots?.[0] || '09:00');
  const [clientName, setClientName] = useState(user?.name || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const existingBookings = getBookings();
  const takenSlotsForDate = useMemo(() => {
    return new Set(
      existingBookings
        .filter(
          (b) =>
            b.providerId === provider.id &&
            b.date === selectedDate &&
            b.status !== 'cancelled'
        )
        .map((b) => b.timeSlot || b.time)
        .filter(Boolean)
    );
  }, [existingBookings, provider.id, selectedDate]);

  const workingDaysSet = useMemo(
    () => new Set(provider.workingDays || []),
    [provider.workingDays]
  );

  const monthCells = useMemo(() => buildMonthCells(calYear, calMonth), [calYear, calMonth]);
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleString('en-ZA', {
    month: 'long',
    year: 'numeric',
  });

  const isDateAllowed = (iso) => {
    if (!iso) return false;
    if (needsAdvance) {
      return iso >= minDate && iso <= maxDate;
    }
    return iso >= todayIso;
  };

  const handleSelectDate = (iso) => {
    setErrorMsg('');
    if (!isDateAllowed(iso)) {
      setErrorMsg(
        needsAdvance
          ? `${provider.category} requires booking between ${minDate} and ${maxDate}.`
          : 'Please choose today or an upcoming date.'
      );
      return;
    }
    setSelectedDate(iso);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isDateAllowed(selectedDate)) {
      setErrorMsg(
        needsAdvance
          ? `Select a date between ${minDate} and ${maxDate}.`
          : 'Select a valid upcoming date.'
      );
      return;
    }

    if (takenSlotsForDate.has(selectedSlot)) {
      setErrorMsg(`${selectedSlot} on ${selectedDate} is already booked. Pick another slot.`);
      return;
    }

    const record = {
      providerId: provider.id,
      providerName: provider.name,
      category: provider.category,
      service: selectedService,
      date: selectedDate,
      timeSlot: selectedSlot,
      clientName: clientName.trim() || 'Client',
      clientEmail: clientEmail.trim() || user?.email || 'client@skawara.co.za',
      notes: notes.trim(),
    };

    saveBooking(record);
    logClientInteraction(
      provider.id,
      { name: record.clientName, email: record.clientEmail },
      `Booked ${record.service} on ${record.date} at ${record.timeSlot}`
    );
    pushNotification(
      'New Appointment Request',
      `${record.clientName} requested ${record.service} with ${provider.name} on ${record.date} at ${record.timeSlot}.`,
      { providerId: provider.id, providerName: provider.name }
    );

    setConfirmedBooking(record);
    if (onBookingComplete) onBookingComplete(record);
  };

  const handleDownloadReceipt = () => {
    if (!confirmedBooking) return;
    const content = [
      'SKA WARA APPOINTMENT RECEIPT',
      `Business: ${confirmedBooking.providerName}`,
      `Category: ${confirmedBooking.category}`,
      `Service: ${confirmedBooking.service}`,
      `Date: ${confirmedBooking.date}`,
      `Time Slot: ${confirmedBooking.timeSlot}`,
      `Client: ${confirmedBooking.clientName} (${confirmedBooking.clientEmail})`,
      confirmedBooking.notes ? `Notes: ${confirmedBooking.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skawara-booking-${confirmedBooking.date}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="business-dashboard-panel">
      <div className="business-dashboard-top">
        <div>
          <h2>Book with {provider.name}</h2>
          <p>
            {provider.category} · {provider.location} · Hours: {provider.openingTime || '09:00'} –{' '}
            {provider.closingTime || '17:00'}
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={onBack}>
          Back to Directory
        </button>
      </div>

      {confirmedBooking ? (
        <div className="credentials-summary-box">
          <h3>Appointment Request Logged</h3>
          <div className="receipt-box">
            <div>
              <span>Business:</span> <strong>{confirmedBooking.providerName}</strong>
            </div>
            <div>
              <span>Service:</span> <strong>{confirmedBooking.service}</strong>
            </div>
            <div>
              <span>Date & Slot:</span>{' '}
              <strong>
                {confirmedBooking.date} at {confirmedBooking.timeSlot}
              </strong>
            </div>
            <div>
              <span>Client:</span> <strong>{confirmedBooking.clientName}</strong>
            </div>
          </div>
          <div className="modal-btns">
            <button
              type="button"
              className="btn-primary-submit"
              onClick={handleDownloadReceipt}
            >
              Download Receipt
            </button>
            <button type="button" className="btn-secondary" onClick={onBack}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form className="business-section" onSubmit={handleSubmit}>
          <div className="calendar-card-box">
            <div className="calendar-toolbar">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (calMonth === 0) {
                    setCalYear((y) => y - 1);
                    setCalMonth(11);
                  } else {
                    setCalMonth((m) => m - 1);
                  }
                }}
              >
                Prev
              </button>
              <h3>{monthLabel}</h3>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (calMonth === 11) {
                    setCalYear((y) => y + 1);
                    setCalMonth(0);
                  } else {
                    setCalMonth((m) => m + 1);
                  }
                }}
              >
                Next
              </button>
            </div>

            <div className="calendar-weekdays-grid">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="calendar-weekday-cell">
                  {wd}
                </div>
              ))}
            </div>

            <div className="calendar-days-grid">
              {monthCells.map((iso, idx) => {
                if (!iso) {
                  return <div key={`empty_${idx}`} className="calendar-day-empty" />;
                }
                const allowed = isDateAllowed(iso);
                const isWorking = workingDaysSet.has(iso);
                const isSelected = selectedDate === iso;

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={!allowed}
                    className={`calendar-day-btn ${isWorking ? 'is-open' : ''} ${
                      isSelected ? 'is-selected' : ''
                    }`}
                    onClick={() => handleSelectDate(iso)}
                  >
                    <span>{Number(iso.split('-')[2])}</span>
                    <small>{isWorking ? 'Available' : allowed ? 'Open' : 'Locked'}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="business-form-grid">
            {provider.services && provider.services.length > 0 && (
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                {provider.services.map((srv, idx) => (
                  <option key={idx} value={srv}>
                    {srv}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
            >
              {(provider.timeSlots || ['09:00', '11:00', '14:00', '16:00']).map((slot) => {
                const isTaken = takenSlotsForDate.has(slot);
                return (
                  <option key={slot} value={slot} disabled={isTaken}>
                    {slot} {isTaken ? '(Booked)' : ''}
                  </option>
                );
              })}
            </select>

            <input
              type="text"
              placeholder="Your Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Your Email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Optional notes or details"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {errorMsg && <div className="client-visibility-banner">{errorMsg}</div>}

          <div className="booking-actions-row">
            <button type="submit" className="btn-primary-submit">
              Confirm Slot ({selectedDate} · {selectedSlot})
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default BookingPage;