import React, { useState, useEffect, useMemo } from 'react';
import {
  getBookings,
  updateBookingStatus,
  getProviderInteractions,
  saveProviders,
  addProviderMilestone,
  getOwnedProviders
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

function BusinessDashboard({ user, providers = [], setProviders, onClose }) {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState(() => getBookings());

  const accountProviders = useMemo(
    () => getOwnedProviders(providers, user?.email),
    [providers, user?.email]
  );

  const [selectedProviderId, setSelectedProviderId] = useState(
    () => accountProviders[0]?.id || ''
  );

  useEffect(() => {
    const firstOwned = accountProviders[0]?.id || '';
    if (!firstOwned) {
      setSelectedProviderId('');
    } else if (!accountProviders.some((p) => p.id === selectedProviderId)) {
      setSelectedProviderId(firstOwned);
    }
  }, [accountProviders, selectedProviderId]);

  const activeProvider =
    accountProviders.find((p) => p.id === selectedProviderId) || accountProviders[0] || null;

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    () => activeProvider?.workingDays?.[0] || toIsoDate(now.getFullYear(), now.getMonth(), now.getDate())
  );

  const [openTime, setOpenTime] = useState(() => activeProvider?.openingTime || '09:00');
  const [closeTime, setCloseTime] = useState(() => activeProvider?.closingTime || '17:00');
  const [newSlot, setNewSlot] = useState('');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneStory, setMilestoneStory] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  useEffect(() => {
    if (activeProvider) {
      setOpenTime(activeProvider.openingTime || '09:00');
      setCloseTime(activeProvider.closingTime || '17:00');
      if (activeProvider.workingDays?.length > 0 && !activeProvider.workingDays.includes(selectedDate)) {
        setSelectedDate(activeProvider.workingDays[0]);
      }
    }
  }, [activeProvider]);

  const ownedIds = useMemo(
    () => new Set(accountProviders.map((p) => p.id)),
    [accountProviders]
  );

  const visibleBookings = useMemo(() => {
    if (activeProvider) {
      return bookings.filter((b) => b.providerId === activeProvider.id);
    }
    return bookings.filter((b) => ownedIds.has(b.providerId));
  }, [bookings, activeProvider, ownedIds]);

  const interactions = activeProvider
    ? getProviderInteractions(activeProvider.id)
    : [];

  const monthCells = useMemo(() => buildMonthCells(calYear, calMonth), [calYear, calMonth]);
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleString('en-ZA', {
    month: 'long',
    year: 'numeric',
  });

  const workingDaysSet = useMemo(
    () => new Set(activeProvider?.workingDays || []),
    [activeProvider]
  );

  const bookingsOnSelectedDate = useMemo(() => {
    if (!activeProvider) return [];
    return bookings.filter(
      (b) =>
        b.providerId === activeProvider.id &&
        b.date === selectedDate &&
        b.status !== 'cancelled'
    );
  }, [bookings, activeProvider, selectedDate]);

  const handleStatusChange = (bookingId, nextStatus) => {
    const updated = updateBookingStatus(bookingId, nextStatus);
    setBookings(updated);
  };

  const persistProviderPatch = (patchFn, noticeMessage) => {
    if (!activeProvider || !setProviders) return;
    const updatedList = providers.map((p) => (p.id === activeProvider.id ? patchFn(p) : p));
    saveProviders(updatedList);
    setProviders(updatedList);
    window.dispatchEvent(new CustomEvent('skawara:providers-updated'));
    if (noticeMessage) {
      setSavedNotice(noticeMessage);
      setTimeout(() => setSavedNotice(''), 3000);
    }
  };

  const handleToggleCalendarDate = (isoDate) => {
    if (!isoDate || !activeProvider) return;
    setSelectedDate(isoDate);

    const currentDays = new Set(activeProvider.workingDays || []);
    if (currentDays.has(isoDate)) {
      currentDays.delete(isoDate);
    } else {
      currentDays.add(isoDate);
    }

    const sortedDays = Array.from(currentDays).sort();
    persistProviderPatch(
      (p) => ({ ...p, workingDays: sortedDays }),
      `Updated availability for ${isoDate}.`
    );
  };

  const handleSaveSchedule = (e) => {
    e.preventDefault();
    if (!activeProvider) return;

    persistProviderPatch((p) => {
      const nextDays = new Set(p.workingDays || []);
      if (selectedDate) nextDays.add(selectedDate);

      const nextSlots = new Set(p.timeSlots || []);
      if (openTime) nextSlots.add(openTime);
      if (newSlot) nextSlots.add(newSlot);

      return {
        ...p,
        openingTime: openTime || '09:00',
        closingTime: closeTime || '17:00',
        workingDays: Array.from(nextDays).sort(),
        timeSlots: Array.from(nextSlots).sort(),
      };
    }, `Saved schedule & hours (${openTime} – ${closeTime}) for ${activeProvider.name}.`);

    setNewSlot('');
  };

  const handleRemoveSlot = (slotToRemove) => {
    persistProviderPatch((p) => ({
      ...p,
      timeSlots: (p.timeSlots || []).filter((s) => s !== slotToRemove),
    }));
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!activeProvider || !setProviders || !milestoneTitle.trim()) return;
    const { updatedProviders } = addProviderMilestone({
      providers,
      providerId: activeProvider.id,
      title: milestoneTitle,
      story: milestoneStory,
    });
    setProviders(updatedProviders);
    setMilestoneTitle('');
    setMilestoneStory('');
    setSavedNotice(`Milestone posted for ${activeProvider.name} and alerts sent.`);
    setTimeout(() => setSavedNotice(''), 3000);
  };

  return (
    <section className="business-dashboard-panel">
      <div className="business-dashboard-top">
        <div>
          <h2>Business Control Center</h2>
          <p>
            {activeProvider ? activeProvider.name : 'No owned business linked yet'} —{' '}
            {user?.email || 'Business Account'}
          </p>
        </div>

        <button type="button" className="btn-secondary" onClick={onClose}>
          Back to Business Posts
        </button>
      </div>

      {savedNotice && <div className="client-visibility-banner">{savedNotice}</div>}

      {accountProviders.length === 0 ? (
        <div className="business-empty-state">
          No business listing is registered under <strong>{user?.email}</strong> yet. Use{' '}
          <strong>+ List Your Business</strong> to register your business under this account.
        </div>
      ) : (
        <>
          {accountProviders.length > 1 && (
            <div className="business-form-grid">
              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
              >
                {accountProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="business-tab-strip">
            <button
              type="button"
              className={`business-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              Pending Appointments ({visibleBookings.length})
            </button>
            <button
              type="button"
              className={`business-tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveTab('leads')}
            >
              Client Interactions ({interactions.length})
            </button>
            <button
              type="button"
              className={`business-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              Scheduling Calendar
            </button>
            <button
              type="button"
              className={`business-tab-btn ${activeTab === 'growth' ? 'active' : ''}`}
              onClick={() => setActiveTab('growth')}
            >
              Upload Work & Growth
            </button>
          </div>

          {activeTab === 'bookings' && (
            <div className="business-bookings-grid">
              {visibleBookings.length === 0 ? (
                <div className="business-empty-state">No appointments booked yet.</div>
              ) : (
                visibleBookings.map((b) => (
                  <div key={b.id} className="business-booking-card">
                    <div className="booking-card-header">
                      <h3 className="booking-card-title">
                        {b.providerName || b.service || 'Booking'}
                      </h3>
                      <span className={`booking-pill ${b.status || 'pending'}`}>
                        {b.status || 'pending'}
                      </span>
                    </div>
                    <p className="booking-detail-line">
                      Client: {b.clientName || b.clientEmail || 'Client'}
                    </p>
                    <p className="booking-detail-line">
                      Date & Time: {b.date || 'TBD'} {b.timeSlot || b.time || ''}
                    </p>
                    <div className="booking-actions-row">
                      <button
                        type="button"
                        className="btn-confirm"
                        onClick={() => handleStatusChange(b.id, 'confirmed')}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => handleStatusChange(b.id, 'cancelled')}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="business-leads-grid">
              {interactions.length === 0 ? (
                <div className="business-empty-state">No client interactions logged yet.</div>
              ) : (
                interactions.map((item) => (
                  <div key={item.id} className="business-lead-card">
                    <h3 className="booking-card-title">{item.action || 'Client Activity'}</h3>
                    <p className="booking-detail-line">
                      Visitor: {item.userName || item.userEmail || 'Guest'}
                    </p>
                    <p className="booking-detail-line">
                      Logged: {item.timestamp || 'Recently'}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'calendar' && activeProvider && (
            <div className="business-section">
              <div className="calendar-card-box">
                <div className="calendar-toolbar">
                  <button type="button" className="btn-secondary" onClick={handlePrevMonth}>
                    Prev
                  </button>
                  <h3>{monthLabel}</h3>
                  <button type="button" className="btn-secondary" onClick={handleNextMonth}>
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
                    const isWorking = workingDaysSet.has(iso);
                    const isSelected = selectedDate === iso;
                    const dayBookingsCount = bookings.filter(
                      (b) =>
                        b.providerId === activeProvider.id &&
                        b.date === iso &&
                        b.status !== 'cancelled'
                    ).length;

                    return (
                      <button
                        key={iso}
                        type="button"
                        className={`calendar-day-btn ${isWorking ? 'is-open' : ''} ${
                          isSelected ? 'is-selected' : ''
                        }`}
                        onClick={() => handleToggleCalendarDate(iso)}
                      >
                        <span>{Number(iso.split('-')[2])}</span>
                        <small>
                          {isWorking ? 'Open' : 'Off'}
                          {dayBookingsCount > 0 ? ` · ${dayBookingsCount} bk` : ''}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form className="business-form-grid" onSubmit={handleSaveSchedule}>
                <label className="file-upload-label">
                  Opening Time
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    required
                  />
                </label>
                <label className="file-upload-label">
                  Closing Time
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    required
                  />
                </label>
                <label className="file-upload-label">
                  Selected Date ({selectedDate})
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </label>
                <label className="file-upload-label">
                  Add Time Slot
                  <input
                    type="time"
                    value={newSlot}
                    onChange={(e) => setNewSlot(e.target.value)}
                  />
                </label>
                <div className="booking-actions-row">
                  <button type="submit" className="btn-primary-submit">
                    Save Schedule & Hours
                  </button>
                </div>
              </form>

              <div className="business-cards-list">
                <div className="business-item-card">
                  <h3 className="business-item-title">
                    Scheduled Slots ({activeProvider.openingTime || '09:00'} –{' '}
                    {activeProvider.closingTime || '17:00'})
                  </h3>
                  {(activeProvider.timeSlots || []).length === 0 ? (
                    <p className="business-meta-text">No time slots added yet.</p>
                  ) : (
                    <div className="services-pill-row">
                      {(activeProvider.timeSlots || []).map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className="service-chip"
                          onClick={() => handleRemoveSlot(slot)}
                        >
                          {slot} ×
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="business-item-card">
                  <h3 className="business-item-title">
                    Bookings on {selectedDate} ({bookingsOnSelectedDate.length})
                  </h3>
                  {bookingsOnSelectedDate.length === 0 ? (
                    <p className="business-meta-text">No active appointments on this date.</p>
                  ) : (
                    <div className="receipt-box">
                      {bookingsOnSelectedDate.map((bk) => (
                        <div key={bk.id}>
                          <strong>{bk.timeSlot || bk.time || 'Slot'}</strong> —{' '}
                          <span>{bk.clientName || bk.clientEmail || 'Client'}</span> (
                          {bk.status || 'pending'})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'growth' && activeProvider && (
            <form className="business-form-grid" onSubmit={handleAddMilestone}>
              <input
                type="text"
                placeholder="Milestone Title"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Growth Story or Update"
                value={milestoneStory}
                onChange={(e) => setMilestoneStory(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary-submit">
                Post Milestone & Alert Clients
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
}

export default BusinessDashboard;