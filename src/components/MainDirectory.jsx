import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getProviders,
  getProviderReviews,
  addAnonymousReview,
  toggleReviewVisibility,
  reactToReview,
  replyToReview,
  logClientInteraction,
  isAdvanceBookingRequired,
  getAllowedAdvanceDateRange,
  generateStrongPassword,
  registerNewBusinessWithVisibility,
  respondToProviderMilestone,
  getThreadMessages,
  sendThreadMessage,
  getOwnedProviders,
  getSavedProviderIds,
  toggleSavedProvider,
  getBookings,
  cancelBooking,
  formatWhatsAppNumber
} from '../utlis/storage';
import BookingPage from '../components/BookingPage';
import BusinessDashboard from '../components/BusinessDashboard';
import NotificationCenter from '../components/NoticificationCenter';
import '../styles/directory.css';

const CATEGORIES = ['All', 'Grooming', 'Beauty', 'Tech', 'Food', 'Mechanics', 'Tutors'];

function formatRelativeTime(isoString) {
  if (!isoString) return 'Recently';
  const diffSec = Math.max(1, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function isProviderOpenNow(provider) {
  const openStr = provider?.openingTime || '08:00';
  const closeStr = provider?.closingTime || '17:00';
  const [openH, openM] = openStr.split(':').map(Number);
  const [closeH, closeM] = closeStr.split(':').map(Number);
  if (
    Number.isNaN(openH) ||
    Number.isNaN(openM) ||
    Number.isNaN(closeH) ||
    Number.isNaN(closeM)
  ) {
    return true;
  }

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + (openM || 0);
  const closeMins = closeH * 60 + (closeM || 0);

  if (closeMins >= openMins) {
    return currentMins >= openMins && currentMins <= closeMins;
  }
  return currentMins >= openMins || currentMins <= closeMins;
}

function getAverageRating(providerId) {
  const reviews = getProviderReviews(providerId, '', false);
  if (!reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  return Number((sum / reviews.length).toFixed(1));
}

function MyBookingsModal({ user, providers = [], onRebook, onClose }) {
  const [bookings, setBookings] = useState(() => getBookings());

  const refreshBookings = useCallback(() => {
    setBookings(getBookings());
  }, []);

  useEffect(() => {
    refreshBookings();
    window.addEventListener('skawara:bookings-updated', refreshBookings);
    return () => window.removeEventListener('skawara:bookings-updated', refreshBookings);
  }, [refreshBookings]);

  const clientEmail = String(user?.email || '').trim().toLowerCase();
  const myBookings = bookings.filter((b) => {
    if (!clientEmail) return true;
    const bEmail = String(b.clientEmail || '').trim().toLowerCase();
    return !bEmail || bEmail === clientEmail;
  });

  const handleCancel = (bookingId) => {
    cancelBooking(bookingId);
    refreshBookings();
  };

  const handleRebook = (bk) => {
    const matchProvider =
      providers.find((p) => p.id === bk.providerId) ||
      providers.find((p) => p.name === bk.providerName) ||
      null;
    if (matchProvider && onRebook) {
      onClose();
      onRebook(matchProvider);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card business-detail-modal">
        <div className="booking-card-header">
          <div>
            <h3>My Bookings ({myBookings.length})</h3>
            <p className="location-text">
              Track upcoming appointments, free up cancelled slots, or rebook quickly.
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {myBookings.length === 0 ? (
          <div className="business-empty-state">
            You do not have any bookings yet. Pick a business card to schedule a slot.
          </div>
        ) : (
          <div className="business-bookings-grid">
            {myBookings.map((bk) => (
              <div key={bk.id} className="business-booking-card">
                <div className="booking-card-header">
                  <h4 className="booking-card-title">
                    {bk.providerName || bk.service || 'Appointment'}
                  </h4>
                  <span className={`booking-pill ${bk.status || 'pending'}`}>
                    {bk.status || 'pending'}
                  </span>
                </div>
                <p className="booking-detail-line">Service: {bk.service || 'Standard Service'}</p>
                <p className="booking-detail-line">
                  When: <strong>{bk.date || 'TBD'}</strong> at{' '}
                  <strong>{bk.timeSlot || bk.time || 'TBD'}</strong>
                </p>
                <div className="booking-actions-row">
                  {bk.status !== 'cancelled' && (
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => handleCancel(bk.id)}
                    >
                      Cancel & Free Slot
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-book-now"
                    onClick={() => handleRebook(bk)}
                  >
                    Rebook
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessDetailsModal({
  provider,
  providers,
  user,
  isBusinessOwner,
  isSaved,
  onToggleSave,
  onProvidersUpdated,
  onOpenBooking,
  onOpenMessage,
  onClose,
}) {
  const viewerEmail = user?.email || '';
  const [reviews, setReviews] = useState(() =>
    getProviderReviews(provider.id, viewerEmail, isBusinessOwner)
  );
  const [rating, setRating] = useState('5');
  const [serviceUsed, setServiceUsed] = useState(provider.services?.[0] || '');
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [milestoneReplyDrafts, setMilestoneReplyDrafts] = useState({});

  const liveProvider = providers.find((p) => p.id === provider.id) || provider;
  const milestones = liveProvider.growthUpdates || [];
  const waPhone = formatWhatsAppNumber(liveProvider.phone);

  const refreshReviews = useCallback(() => {
    setReviews(getProviderReviews(liveProvider.id, viewerEmail, isBusinessOwner));
  }, [liveProvider.id, viewerEmail, isBusinessOwner]);

  useEffect(() => {
    refreshReviews();
    window.addEventListener('skawara:reviews-updated', refreshReviews);
    return () => window.removeEventListener('skawara:reviews-updated', refreshReviews);
  }, [refreshReviews]);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    const cleanComment = comment.trim();
    if (!cleanComment) return;

    addAnonymousReview({
      providerId: liveProvider.id,
      authorLabel: user?.name || 'Anonymous Client',
      authorEmail: viewerEmail,
      rating: Number(rating) || 5,
      service: serviceUsed,
      comment: cleanComment,
      isPublic,
    });

    logClientInteraction(
      liveProvider.id,
      user,
      isPublic ? 'Posted Public Review' : 'Posted Private Review Note'
    );
    setComment('');
    refreshReviews();
  };

  const handleReplySubmit = (e, reviewId) => {
    e.preventDefault();
    const text = (replyDrafts[reviewId] || '').trim();
    if (!text) return;

    replyToReview({
      reviewId,
      senderName: isBusinessOwner ? liveProvider.name : user?.name || 'Client',
      role: isBusinessOwner ? 'business' : 'client',
      text,
    });

    setReplyDrafts((prev) => ({ ...prev, [reviewId]: '' }));
    refreshReviews();
  };

  const handleMilestoneReaction = (milestoneId, reaction) => {
    const { updatedProviders } = respondToProviderMilestone({
      providers,
      providerId: liveProvider.id,
      milestoneId,
      user,
      reaction,
    });
    if (onProvidersUpdated) onProvidersUpdated(updatedProviders);
  };

  const handleMilestoneReplySubmit = (e, milestoneId, key) => {
    e.preventDefault();
    const text = (milestoneReplyDrafts[key] || '').trim();
    if (!text) return;

    const { updatedProviders } = respondToProviderMilestone({
      providers,
      providerId: liveProvider.id,
      milestoneId,
      user,
      reaction: 'Reply',
      comment: text,
    });

    if (onProvidersUpdated) onProvidersUpdated(updatedProviders);
    setMilestoneReplyDrafts((prev) => ({ ...prev, [key]: '' }));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card business-detail-modal">
        <div className="booking-card-header">
          <div>
            <h3>{liveProvider.name}</h3>
            <p className="location-text">
              {liveProvider.category} · {liveProvider.location} · {liveProvider.price}
            </p>
          </div>
          <div className="booking-actions-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onToggleSave(liveProvider.id)}
            >
              {isSaved ? 'Saved Plug ★' : 'Save Plug ☆'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <p className="booking-detail-line">
          Hours: <strong>{liveProvider.openingTime || '09:00'}</strong> –{' '}
          <strong>{liveProvider.closingTime || '17:00'}</strong> ·{' '}
          <span>{isProviderOpenNow(liveProvider) ? 'Open Now' : 'Currently Closed'}</span>
        </p>

        {liveProvider.services && liveProvider.services.length > 0 && (
          <div className="services-pill-row">
            {liveProvider.services.map((srv, idx) => (
              <span key={idx} className="service-chip">
                {srv}
              </span>
            ))}
          </div>
        )}

        <div className="booking-actions-row">
          <button
            type="button"
            className="btn-book-now"
            onClick={() => {
              onClose();
              onOpenBooking(liveProvider);
            }}
          >
            Book Appointment
          </button>
          <button
            type="button"
            className="btn-message-open"
            onClick={() => {
              onClose();
              onOpenMessage(liveProvider);
            }}
          >
            Message
          </button>
          {waPhone && (
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noreferrer"
              className="btn-wa-quick"
            >
              WhatsApp
            </a>
          )}
        </div>

        {milestones.length > 0 && (
          <div className="reviews-section">
            <h4>Milestones & Updates ({milestones.length})</h4>
            {milestones.map((ms, mIdx) => {
              const msId = ms.id || `${liveProvider.id}_ms_${mIdx}`;
              const replyKey = `${liveProvider.id}_${msId}`;
              const responses = ms.responses || [];

              return (
                <div key={replyKey} className="growth-highlight">
                  <div>
                    <strong>{ms.title}</strong>
                  </div>
                  {ms.story && <p className="booking-detail-line">{ms.story}</p>}

                  <div className="booking-actions-row">
                    <button
                      type="button"
                      className="btn-action-secondary"
                      onClick={() => handleMilestoneReaction(ms.id, 'Interested')}
                    >
                      Interested
                    </button>
                    <button
                      type="button"
                      className="btn-wa-quick"
                      onClick={() => handleMilestoneReaction(ms.id, 'Helpful Update')}
                    >
                      Helpful ({responses.length})
                    </button>
                  </div>

                  {responses.length > 0 && (
                    <div className="receipt-box">
                      {responses.map((r) => (
                        <div key={r.id}>
                          <strong>{r.responderName}</strong> <span>({r.reaction})</span>
                          {r.comment ? `: ${r.comment}` : ''}
                        </div>
                      ))}
                    </div>
                  )}

                  <form
                    className="booking-actions-row"
                    onSubmit={(e) => handleMilestoneReplySubmit(e, ms.id, replyKey)}
                  >
                    <input
                      type="text"
                      placeholder="Reply or ask about this update..."
                      value={milestoneReplyDrafts[replyKey] || ''}
                      onChange={(e) =>
                        setMilestoneReplyDrafts((prev) => ({
                          ...prev,
                          [replyKey]: e.target.value,
                        }))
                      }
                    />
                    <button type="submit" className="btn-action-primary">
                      Respond
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}

        <div className="reviews-section">
          <h4>Reviews & Comments ({reviews.length})</h4>

          {reviews.length === 0 ? (
            <p className="booking-detail-line">No visible comments yet. Post one below.</p>
          ) : (
            <div className="social-feed-list">
              {reviews.map((r) => {
                const isAuthor =
                  Boolean(viewerEmail) &&
                  String(r.authorEmail || '').toLowerCase() === viewerEmail.toLowerCase();
                const isPrivateComment = r.isPublic === false;

                return (
                  <div
                    key={r.id}
                    className={`social-review-card ${isPrivateComment ? 'private-comment' : ''}`}
                  >
                    <div className="social-review-header">
                      <div className="social-author-row">
                        <span className="social-avatar">
                          {(r.authorLabel || 'C').charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong>{r.authorLabel || 'Anonymous Client'}</strong>
                          <span className="social-timestamp">
                            {' '}
                            · {formatRelativeTime(r.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="social-badges-row">
                        <span className="booking-pill confirmed">★ {r.rating}/5</span>
                        {r.verifiedBooking && (
                          <span className="booking-pill confirmed">Verified Booking</span>
                        )}
                        <span className={`booking-pill ${isPrivateComment ? 'cancelled' : ''}`}>
                          {isPrivateComment ? 'Private' : 'Public'}
                        </span>
                      </div>
                    </div>

                    {r.service && <div className="booking-detail-line">Service: {r.service}</div>}
                    <p className="social-review-body">{r.comment}</p>

                    <div className="booking-actions-row">
                      <button
                        type="button"
                        className="btn-action-secondary"
                        onClick={() => {
                          reactToReview(r.id, 'helpful');
                          refreshReviews();
                        }}
                      >
                        Helpful ({r.reactions?.helpful || 0})
                      </button>
                      <button
                        type="button"
                        className="btn-wa-quick"
                        onClick={() => {
                          reactToReview(r.id, 'recommend');
                          refreshReviews();
                        }}
                      >
                        Recommend ({r.reactions?.recommend || 0})
                      </button>

                      {isAuthor && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            toggleReviewVisibility(r.id);
                            refreshReviews();
                          }}
                        >
                          {isPrivateComment ? 'Make Public' : 'Hide from Public'}
                        </button>
                      )}
                    </div>

                    {(r.replies || []).length > 0 && (
                      <div className="social-replies-thread">
                        {r.replies.map((rep) => (
                          <div key={rep.id} className="social-reply-item">
                            <strong>{rep.senderName}</strong>
                            <span className="social-timestamp">
                              {' '}
                              · {formatRelativeTime(rep.createdAt)}
                            </span>
                            <p className="booking-detail-line">{rep.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <form
                      className="booking-actions-row"
                      onSubmit={(e) => handleReplySubmit(e, r.id)}
                    >
                      <input
                        type="text"
                        placeholder="Reply to this post..."
                        value={replyDrafts[r.id] || ''}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({
                            ...prev,
                            [r.id]: e.target.value,
                          }))
                        }
                      />
                      <button type="submit" className="btn-action-primary">
                        Reply
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}

          <form className="review-form" onSubmit={handleSubmitReview}>
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="5">5 Stars — Excellent</option>
              <option value="4">4 Stars — Good</option>
              <option value="3">3 Stars — Fair</option>
              <option value="2">2 Stars — Needs Work</option>
              <option value="1">1 Star — Poor</option>
            </select>

            {liveProvider.services && liveProvider.services.length > 0 ? (
              <select value={serviceUsed} onChange={(e) => setServiceUsed(e.target.value)}>
                {liveProvider.services.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Service used (optional)"
                value={serviceUsed}
                onChange={(e) => setServiceUsed(e.target.value)}
              />
            )}

            <select
              value={isPublic ? 'public' : 'private'}
              onChange={(e) => setIsPublic(e.target.value === 'public')}
            >
              <option value="public">Public Comment (Visible to Everyone)</option>
              <option value="private">Private Comment (Hidden Unless Made Public)</option>
            </select>

            <input
              type="text"
              placeholder="Write a review or comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />

            <button type="submit" className="btn-action-primary">
              {isPublic ? 'Post Publicly' : 'Save Privately'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function MessageThreadModal({ provider, user, isBusinessAccount, onClose }) {
  const threadId = `${provider.id}_${user?.email || 'member'}`;
  const [messages, setMessages] = useState(() => getThreadMessages(threadId));
  const [draft, setDraft] = useState('');
  const senderRole = isBusinessAccount ? 'business' : 'client';

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    const updated = sendThreadMessage(threadId, {
      sender: user?.name || user?.email || 'Member',
      role: senderRole,
      text: trimmed,
    });
    logClientInteraction(provider.id, user, 'Sent Direct Message');
    setMessages(updated);
    setDraft('');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>Message {provider.name}</h3>
        <div className="receipt-box">
          {messages.length === 0 ? (
            <p className="muted-text">No messages yet. Start the conversation below.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id}>
                <strong>{m.sender || 'User'}:</strong> <span>{m.text}</span>
              </div>
            ))
          )}
        </div>
        <form className="modal-form-stack" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Write a message..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            required
          />
          <div className="modal-btns">
            <button type="submit" className="btn-primary-submit">
              Send
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MainDirectory({ user, onLogout }) {
  const [viewMode] = useState('business');
  const isBusinessAccount = viewMode === 'business';
  const { minDate, maxDate } = getAllowedAdvanceDateRange();

  const [providers, setProviders] = useState([]);
  const [savedIds, setSavedIds] = useState(() => getSavedProviderIds(user?.email));
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArea, setSelectedArea] = useState('All');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [bookingProvider, setBookingProvider] = useState(null);
  const [activeMessageProvider, setActiveMessageProvider] = useState(null);
  const [showBusinessHub, setShowBusinessHub] = useState(false);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState('');
  const [milestoneBanner, setMilestoneBanner] = useState(null);

  const [bizName, setBizName] = useState('');
  const [bizEmail, setBizEmail] = useState(user?.email || '');
  const [bizPassword, setBizPassword] = useState(() => generateStrongPassword(12));
  const [showPassword, setShowPassword] = useState(false);
  const [bizCategory, setBizCategory] = useState('Mechanics');
  const [bizServices, setBizServices] = useState('');
  const [bizLocation, setBizLocation] = useState('');
  const [bizPrice, setBizPrice] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizOpenTime, setBizOpenTime] = useState('09:00');
  const [bizCloseTime, setBizCloseTime] = useState('17:00');
  const [bizImage, setBizImage] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const triggerToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  useEffect(() => {
    setProviders(getProviders());
    setSavedIds(getSavedProviderIds(user?.email));

    const handleRealtimeEvent = (e) => {
      if (e.detail?.title && e.detail?.message) {
        triggerToast(`${e.detail.title}: ${e.detail.message}`);
      }
    };

    const handleProvidersSync = () => {
      setProviders(getProviders());
    };

    const handleSavedSync = () => {
      setSavedIds(getSavedProviderIds(user?.email));
    };

    const handleMilestoneAlert = (e) => {
      if (e.detail?.bannerText) {
        setMilestoneBanner({
          id: e.detail.milestone?.id || Date.now().toString(),
          title: 'New Milestone Update',
          message: e.detail.bannerText,
        });
      }
    };

    const handleNewBizAlert = (e) => {
      if (e.detail?.bannerText) {
        setMilestoneBanner({
          id: e.detail.provider?.id || Date.now().toString(),
          title: 'New Business Update',
          message: e.detail.bannerText,
        });
      }
    };

    window.addEventListener('skawara:realtime-event', handleRealtimeEvent);
    window.addEventListener('skawara:providers-updated', handleProvidersSync);
    window.addEventListener('skawara:saved-updated', handleSavedSync);
    window.addEventListener('skawara:milestone-alert', handleMilestoneAlert);
    window.addEventListener('skawara:new-business-alert', handleNewBizAlert);

    return () => {
      window.removeEventListener('skawara:realtime-event', handleRealtimeEvent);
      window.removeEventListener('skawara:providers-updated', handleProvidersSync);
      window.removeEventListener('skawara:saved-updated', handleSavedSync);
      window.removeEventListener('skawara:milestone-alert', handleMilestoneAlert);
      window.removeEventListener('skawara:new-business-alert', handleNewBizAlert);
    };
  }, [triggerToast, user?.email]);

  const ownedProviders = getOwnedProviders(providers, user?.email);
  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

  const areaOptions = useMemo(() => {
    const areas = new Set(
      providers.map((p) => String(p.location || '').trim()).filter(Boolean)
    );
    return ['All', ...Array.from(areas)];
  }, [providers]);

  const handleToggleSave = (providerId) => {
    const nextList = toggleSavedProvider(providerId, user?.email);
    setSavedIds(nextList);
    const nowSaved = nextList.includes(providerId);
    triggerToast(nowSaved ? 'Added to Saved Plugs.' : 'Removed from Saved Plugs.');
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setBizImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRegeneratePassword = () => {
    setBizPassword(generateStrongPassword(12));
    setShowPassword(true);
  };

  const handleCreateBusiness = (e) => {
    e.preventDefault();

    const { newEntry, updatedProviders } = registerNewBusinessWithVisibility({
      providers,
      ownerSessionEmail: user?.email || 'business@skawara.co.za',
      businessEmail: bizEmail || user?.email,
      generatedPassword: bizPassword,
      name: bizName,
      category: bizCategory,
      location: bizLocation,
      price: bizPrice,
      phone: bizPhone,
      coverImage: bizImage,
      servicesList: bizServices,
      openingTime: bizOpenTime,
      closingTime: bizCloseTime,
      workingDays: isAdvanceBookingRequired(bizCategory)
        ? [minDate, maxDate]
        : ['2026-11-24', '2026-11-25', '2026-11-26'],
      timeSlots: [bizOpenTime, '11:00', '14:00', bizCloseTime]
    });

    setProviders(updatedProviders);
    setCreatedCredentials({
      name: newEntry.name,
      email: newEntry.businessEmail,
      password: newEntry.generatedPassword,
      services: newEntry.services
    });

    setBizName('');
    setBizServices('');
    setBizLocation('');
    setBizPrice('');
    setBizPhone('');
    setBizImage('');
    setBizPassword(generateStrongPassword(12));
    triggerToast(`${newEntry.name} is live! Network members have been alerted.`);
  };

  const handleOpenBooking = (provider) => {
    logClientInteraction(provider.id, user, 'Opened Booking Calendar');
    setBookingProvider(provider);
  };

  const handleOpenDetails = (provider) => {
    logClientInteraction(provider.id, user, 'Opened Reviews & Details');
    setSelectedBusiness(provider);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProviders = useMemo(() => {
    const matched = providers.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      if (!matchesCat) return false;

      if (selectedArea !== 'All' && p.location !== selectedArea) {
        return false;
      }

      if (openNowOnly && !isProviderOpenNow(p)) {
        return false;
      }

      if (savedOnly && !savedSet.has(p.id)) {
        return false;
      }

      if (!normalizedQuery) return true;

      const servicesText = (p.services || []).join(' ').toLowerCase();
      return (
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.location.toLowerCase().includes(normalizedQuery) ||
        p.category.toLowerCase().includes(normalizedQuery) ||
        p.price.toLowerCase().includes(normalizedQuery) ||
        servicesText.includes(normalizedQuery)
      );
    });

    if (sortBy === 'rating') {
      return [...matched].sort((a, b) => getAverageRating(b.id) - getAverageRating(a.id));
    }
    return matched;
  }, [providers, selectedCategory, selectedArea, openNowOnly, savedOnly, savedSet, normalizedQuery, sortBy]);

  if (bookingProvider) {
    return (
      <BookingPage
        provider={bookingProvider}
        user={user}
        onBack={() => {
          setProviders(getProviders());
          setBookingProvider(null);
        }}
        onBookingComplete={() =>
          triggerToast('Appointment locked in! Download receipt or open Gmail/WhatsApp.')
        }
      />
    );
  }

  return (
    <div className="directory-shell" data-vibe={selectedCategory.toLowerCase()}>
      {toast && <div className="toast-banner">{toast}</div>}

      <header className="top-navbar">
        <div className="brand-group">
          <h1>Ska wara</h1>
          <span className="role-pill">Business Account</span>
        </div>

        <div className="nav-actions">
          <NotificationCenter
            user={user}
            providers={providers}
            onProvidersUpdated={setProviders}
            onOpenBook={handleOpenBooking}
          />

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowMyBookings(true)}
          >
            My Bookings
          </button>

          <button
            type="button"
            className="btn-hub-toggle"
            onClick={() => setShowBusinessHub(!showBusinessHub)}
          >
            {showBusinessHub
              ? 'View Business Posts'
              : `Manage Bookings & Leads (${ownedProviders.length})`}
          </button>

          <button
            type="button"
            className="btn-add-biz"
            onClick={() => {
              setCreatedCredentials(null);
              setShowAddModal(true);
            }}
          >
            + List Your Business
          </button>

          <button type="button" className="btn-logout" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {milestoneBanner && (
        <div className="client-visibility-banner">
          <div>
            <strong>{milestoneBanner.title}:</strong> {milestoneBanner.message}
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setMilestoneBanner(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {showBusinessHub ? (
        <BusinessDashboard
          user={user}
          providers={providers}
          setProviders={setProviders}
          onClose={() => setShowBusinessHub(false)}
        />
      ) : (
        <>
          <section className="filter-bar">
            <div className="search-box-wrap">
              <input
                type="text"
                className="search-input"
                placeholder="Search mechanics, tutors, services, or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  Clear
                </button>
              )}
              <span className="search-count-badge">{filteredProviders.length} found</span>
            </div>

            <div className="category-pills">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={selectedCategory === cat ? 'active' : ''}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="smart-filters-row">
              <button
                type="button"
                className={`smart-chip-btn ${openNowOnly ? 'active' : ''}`}
                onClick={() => setOpenNowOnly((prev) => !prev)}
              >
                Open Now
              </button>

              <button
                type="button"
                className={`smart-chip-btn ${savedOnly ? 'active' : ''}`}
                onClick={() => setSavedOnly((prev) => !prev)}
              >
                Saved Plugs ({savedIds.length})
              </button>

              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
              >
                {areaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area === 'All' ? 'All Areas' : area}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Sort: Featured</option>
                <option value="rating">Sort: Highest Rated</option>
              </select>
            </div>
          </section>

          <main className="cards-grid">
            {filteredProviders.map((provider) => {
              const needsAdvance = isAdvanceBookingRequired(provider.category);
              const reviewCount = getProviderReviews(
                provider.id,
                user?.email,
                isBusinessAccount
              ).length;
              const avgRating = getAverageRating(provider.id);
              const openNow = isProviderOpenNow(provider);
              const isSaved = savedSet.has(provider.id);
              const isOwner = ownedProviders.some((op) => op.id === provider.id);
              const waPhone = formatWhatsAppNumber(provider.phone);

              return (
                <article
                  key={provider.id}
                  className="plug-card"
                  onClick={() => handleOpenDetails(provider)}
                >
                  <div className="card-media">
                    <img src={provider.coverImage} alt={provider.name} />
                    <span className="price-tag">{provider.price}</span>
                    <span className="cat-badge">{provider.category}</span>
                  </div>

                  <div className="card-body">
                    <div className="booking-card-header">
                      <h3>{provider.name}</h3>
                      <div className="social-badges-row">
                        {avgRating > 0 && (
                          <span className="booking-pill confirmed">★ {avgRating}</span>
                        )}
                        <span className={`booking-pill ${openNow ? 'confirmed' : ''}`}>
                          {openNow ? 'Open Now' : 'Closed'}
                        </span>
                        {isOwner && <span className="booking-pill confirmed">Your Account</span>}
                      </div>
                    </div>

                    <p className="location-text">{provider.location}</p>
                    <p className="location-text">
                      Open: <strong>{provider.openingTime || '09:00'}</strong> – Close:{' '}
                      <strong>{provider.closingTime || '17:00'}</strong>
                    </p>

                    {provider.services && provider.services.length > 0 && (
                      <div className="services-pill-row">
                        {provider.services.map((srv, idx) => (
                          <span key={idx} className="service-chip">
                            {srv}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="booking-rule-tag">
                      {needsAdvance
                        ? `Book 3–7 days ahead (${minDate} – ${maxDate})`
                        : 'Flexible booking window'}
                    </div>

                    <div
                      className="card-footer-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleToggleSave(provider.id)}
                      >
                        {isSaved ? 'Saved ★' : 'Save ☆'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleOpenDetails(provider)}
                      >
                        Reviews & Updates ({reviewCount})
                      </button>
                      <button
                        type="button"
                        className="btn-book-now"
                        onClick={() => handleOpenBooking(provider)}
                      >
                        Book
                      </button>
                      <button
                        type="button"
                        className="btn-message-open"
                        onClick={() => setActiveMessageProvider(provider)}
                      >
                        Message
                      </button>
                      {waPhone && (
                        <a
                          href={`https://wa.me/${waPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-wa-quick"
                          onClick={() =>
                            logClientInteraction(provider.id, user, 'Clicked WhatsApp Chat')
                          }
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </main>
        </>
      )}

      {showMyBookings && (
        <MyBookingsModal
          user={user}
          providers={providers}
          onRebook={handleOpenBooking}
          onClose={() => setShowMyBookings(false)}
        />
      )}

      {selectedBusiness && (
        <BusinessDetailsModal
          provider={selectedBusiness}
          providers={providers}
          user={user}
          isBusinessOwner={ownedProviders.some((op) => op.id === selectedBusiness.id)}
          isSaved={savedSet.has(selectedBusiness.id)}
          onToggleSave={handleToggleSave}
          onProvidersUpdated={setProviders}
          onOpenBooking={handleOpenBooking}
          onOpenMessage={setActiveMessageProvider}
          onClose={() => setSelectedBusiness(null)}
        />
      )}

      {activeMessageProvider && (
        <MessageThreadModal
          provider={activeMessageProvider}
          user={user}
          isBusinessAccount={isBusinessAccount}
          onClose={() => setActiveMessageProvider(null)}
        />
      )}

      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            {createdCredentials ? (
              <div className="credentials-summary-box">
                <h3>Business Live & Network Alerted!</h3>
                <p className="muted-text">
                  Members in the Ska wara network have been notified about{' '}
                  <strong>{createdCredentials.name}</strong>.
                </p>
                <div className="receipt-box">
                  <div>
                    <span>Business Email:</span> <strong>{createdCredentials.email}</strong>
                  </div>
                  <div>
                    <span>Generated Password:</span> <strong>{createdCredentials.password}</strong>
                  </div>
                  <div>
                    <span>Services:</span>{' '}
                    <strong>{createdCredentials.services.join(', ')}</strong>
                  </div>
                </div>
                <div className="modal-btns">
                  <button
                    type="button"
                    className="btn-primary-submit"
                    onClick={() => setCreatedCredentials(null)}
                  >
                    Add Another Business
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form className="modal-form-stack" onSubmit={handleCreateBusiness}>
                <h3>Register Business & Alert Network</h3>

                <input
                  type="text"
                  placeholder="Business Name"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  required
                />

                <input
                  type="email"
                  placeholder="Business Email (e.g. studio@skawara.co.za)"
                  value={bizEmail}
                  onChange={(e) => setBizEmail(e.target.value)}
                  required
                />

                <div className="password-gen-row">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Account Password"
                    value={bizPassword}
                    onChange={(e) => setBizPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    className="btn-hub-toggle"
                    onClick={handleRegeneratePassword}
                  >
                    Generate
                  </button>
                </div>

                <select value={bizCategory} onChange={(e) => setBizCategory(e.target.value)}>
                  {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Services Offered (comma-separated, e.g. Brake Repair, Oil Change)"
                  value={bizServices}
                  onChange={(e) => setBizServices(e.target.value)}
                  required
                />

                <input
                  type="text"
                  placeholder="Location / Area"
                  value={bizLocation}
                  onChange={(e) => setBizLocation(e.target.value)}
                  required
                />

                <input
                  type="text"
                  placeholder="Starting Rate (e.g. R150)"
                  value={bizPrice}
                  onChange={(e) => setBizPrice(e.target.value)}
                  required
                />

                <input
                  type="tel"
                  placeholder="WhatsApp Number (e.g. 27712345678)"
                  value={bizPhone}
                  onChange={(e) => setBizPhone(e.target.value)}
                  required
                />

                <div className="business-form-grid">
                  <label className="file-upload-label">
                    Opening Time
                    <input
                      type="time"
                      value={bizOpenTime}
                      onChange={(e) => setBizOpenTime(e.target.value)}
                    />
                  </label>
                  <label className="file-upload-label">
                    Closing Time
                    <input
                      type="time"
                      value={bizCloseTime}
                      onChange={(e) => setBizCloseTime(e.target.value)}
                    />
                  </label>
                </div>

                <label className="file-upload-label">
                  Upload Cover Photo:
                  <input type="file" accept="image/*" onChange={handleCoverUpload} />
                </label>

                <div className="modal-btns">
                  <button type="submit" className="btn-primary-submit">
                    Publish & Alert Network
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MainDirectory;