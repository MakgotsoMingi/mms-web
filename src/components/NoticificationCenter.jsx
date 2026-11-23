import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getNotifications,
  markAllNotificationsRead,
  deleteNotification,
  sendThreadMessage,
  getThreadMessages,
  logClientInteraction,
  respondToProviderMilestone,
  scanUpcomingAppointmentAlerts,
  updateBookingStatus
} from '../utlis/storage';
import '../styles/directory.css';

function NotificationCenter({ user, providers = [], onProvidersUpdated, onOpenBook }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [items, setItems] = useState(() => {
    scanUpcomingAppointmentAlerts(user?.email);
    return getNotifications();
  });
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [messagesByThread, setMessagesByThread] = useState({});

  const refreshNotifications = useCallback(() => {
    scanUpcomingAppointmentAlerts(user?.email);
    const latest = getNotifications();
    setItems(latest);
    setSelectedAlert((prev) => {
      if (!prev) return null;
      return latest.find((n) => n.id === prev.id) || null;
    });
  }, [user?.email]);

  useEffect(() => {
    refreshNotifications();

    const intervalId = window.setInterval(refreshNotifications, 60000);

    window.addEventListener('skawara:notifications-updated', refreshNotifications);
    window.addEventListener('skawara:milestone-alert', refreshNotifications);
    window.addEventListener('skawara:new-business-alert', refreshNotifications);
    window.addEventListener('skawara:booking-status-alert', refreshNotifications);
    window.addEventListener('skawara:upcoming-appointment', refreshNotifications);
    window.addEventListener('skawara:realtime-event', refreshNotifications);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('skawara:notifications-updated', refreshNotifications);
      window.removeEventListener('skawara:milestone-alert', refreshNotifications);
      window.removeEventListener('skawara:new-business-alert', refreshNotifications);
      window.removeEventListener('skawara:booking-status-alert', refreshNotifications);
      window.removeEventListener('skawara:upcoming-appointment', refreshNotifications);
      window.removeEventListener('skawara:realtime-event', refreshNotifications);
    };
  }, [refreshNotifications]);

  const getThreadKeyForAlert = (notif) => {
    const provider =
      providers.find((p) => p.id === notif?.providerId) ||
      providers.find((p) => p.name === notif?.providerName) ||
      null;
    return provider
      ? `${provider.id}_${user?.email || 'member'}`
      : `alert_${notif?.id || 'general'}`;
  };

  const getProviderForAlert = (notif) =>
    providers.find((p) => p.id === notif?.providerId) ||
    providers.find((p) => p.name === notif?.providerName) ||
    providers[0] ||
    null;

  const visibleItems = useMemo(() => {
    if (filterType === 'appointments') {
      return items.filter(
        (n) => Boolean(n.bookingId) || /appointment|booking/i.test(n.title || '')
      );
    }
    if (filterType === 'updates') {
      return items.filter(
        (n) => !n.bookingId && !/appointment|booking/i.test(n.title || '')
      );
    }
    return items;
  }, [items, filterType]);

  const unreadCount = items.filter((n) => !n.read).length;

  const handleOpenAlertsPopup = () => {
    scanUpcomingAppointmentAlerts(user?.email);
    const latest = getNotifications();
    setItems(latest);
    const nextThreads = {};
    latest.forEach((n) => {
      const key = getThreadKeyForAlert(n);
      nextThreads[key] = getThreadMessages(key);
    });
    setMessagesByThread(nextThreads);
    setSelectedAlert(latest[0] || null);
    setModalOpen(true);
    if (unreadCount > 0) {
      markAllNotificationsRead();
    }
  };

  const handleDeleteAlert = (notifId) => {
    const updated = deleteNotification(notifId);
    setItems(updated);
    if (selectedAlert?.id === notifId) {
      setSelectedAlert(updated[0] || null);
    }
  };

  const handleSendAlertReply = (e, notif) => {
    e.preventDefault();
    const draft = (replyDrafts[notif.id] || '').trim();
    if (!draft) return;

    const threadKey = getThreadKeyForAlert(notif);
    const provider = getProviderForAlert(notif);
    const nextMsgs = sendThreadMessage(threadKey, {
      sender: user?.name || user?.email || 'Member',
      role: 'client',
      text: draft,
    });

    if (provider) {
      logClientInteraction(provider.id, user, `Alert Reply: "${draft}"`);
    }

    setMessagesByThread((prev) => ({ ...prev, [threadKey]: nextMsgs }));
    setReplyDrafts((prev) => ({ ...prev, [notif.id]: '' }));
    setSelectedAlert(notif);
  };

  const handleInterestedFromAlert = (notif) => {
    const provider = getProviderForAlert(notif);
    if (!provider || typeof onProvidersUpdated !== 'function') return;
    const comment = (replyDrafts[notif.id] || '').trim();
    const { updatedProviders } = respondToProviderMilestone({
      providers,
      providerId: provider.id,
      milestoneId: notif.milestoneId,
      user,
      reaction: 'Interested via Alert',
      comment,
    });
    onProvidersUpdated(updatedProviders);
    setReplyDrafts((prev) => ({ ...prev, [notif.id]: '' }));
  };

  const handleConfirmBookingFromAlert = (notif) => {
    if (!notif?.bookingId) return;
    updateBookingStatus(notif.bookingId, 'confirmed');
    const threadKey = getThreadKeyForAlert(notif);
    const nextMsgs = sendThreadMessage(threadKey, {
      sender: user?.name || user?.email || 'Member',
      role: 'client',
      text: 'Confirmed attendance for upcoming appointment.',
    });
    setMessagesByThread((prev) => ({ ...prev, [threadKey]: nextMsgs }));
    refreshNotifications();
  };

  return (
    <div className="notification-wrap">
      <button
        type="button"
        className="btn-notif"
        onClick={handleOpenAlertsPopup}
      >
        Alerts
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="booking-card-header">
              <h3>Alerts & Upcoming Reminders ({visibleItems.length})</h3>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  markAllNotificationsRead();
                  refreshNotifications();
                }}
              >
                Mark All Read
              </button>
            </div>

            <div className="business-tab-strip">
              <button
                type="button"
                className={`business-tab-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                className={`business-tab-btn ${filterType === 'appointments' ? 'active' : ''}`}
                onClick={() => setFilterType('appointments')}
              >
                Appointments
              </button>
              <button
                type="button"
                className={`business-tab-btn ${filterType === 'updates' ? 'active' : ''}`}
                onClick={() => setFilterType('updates')}
              >
                Updates
              </button>
            </div>

            {visibleItems.length === 0 ? (
              <div className="business-empty-state">
                No alerts in this view right now.
              </div>
            ) : (
              <div className="modal-form-stack">
                {visibleItems.map((notif) => {
                  const threadKey = getThreadKeyForAlert(notif);
                  const threadMsgs =
                    messagesByThread[threadKey] || getThreadMessages(threadKey);
                  const provider = getProviderForAlert(notif);
                  const isFocused = selectedAlert?.id === notif.id;

                  return (
                    <div
                      key={notif.id}
                      className={`notification-item ${isFocused ? 'active-alert' : ''}`}
                    >
                      <div className="booking-card-header">
                        <strong className="business-item-title">{notif.title || 'Update'}</strong>
                        <span className="booking-pill confirmed">
                          {notif.recipientRole
                            ? `${notif.recipientRole} · ${notif.providerName || 'Network'}`
                            : notif.providerName || 'Network'}
                        </span>
                      </div>

                      <p className="notification-meta">{notif.message}</p>

                      {threadMsgs.length > 0 && (
                        <div className="receipt-box">
                          {threadMsgs.map((m) => (
                            <div key={m.id}>
                              <strong>{m.sender || 'Member'}:</strong> <span>{m.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <form
                        className="booking-actions-row"
                        onSubmit={(e) => handleSendAlertReply(e, notif)}
                      >
                        <input
                          type="text"
                          placeholder="Type a response or message back..."
                          value={replyDrafts[notif.id] || ''}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({
                              ...prev,
                              [notif.id]: e.target.value,
                            }))
                          }
                          required
                        />
                        <button type="submit" className="btn-primary-submit">
                          Respond
                        </button>
                      </form>

                      <div className="booking-actions-row">
                        {notif.bookingId && (
                          <button
                            type="button"
                            className="btn-confirm"
                            onClick={() => handleConfirmBookingFromAlert(notif)}
                          >
                            Confirm Attendance
                          </button>
                        )}
                        {provider && (
                          <>
                            <button
                              type="button"
                              className="btn-action-secondary"
                              onClick={() => handleInterestedFromAlert(notif)}
                            >
                              Interested
                            </button>
                            {typeof onOpenBook === 'function' && (
                              <button
                                type="button"
                                className="btn-book-now"
                                onClick={() => {
                                  setModalOpen(false);
                                  onOpenBook(provider);
                                }}
                              >
                                Book Slot
                              </button>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          className="btn-delete-biz"
                          onClick={() => handleDeleteAlert(notif.id)}
                        >
                          Delete Alert
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="modal-btns">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setModalOpen(false)}
              >
                Close Pop-Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;