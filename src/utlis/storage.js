const STORAGE_KEYS = {
  THREADS: 'mms_threads',
  PROVIDERS: 'mms_providers',
  BOOKINGS: 'mms_bookings',
  REVIEWS: 'mms_reviews',
  INTERACTIONS: 'mms_interactions',
  NOTIFICATIONS: 'mms_notifications',
  SAVED_PROVIDERS: 'mms_saved_providers',
};

const ADVANCE_BOOKING_CATEGORIES = new Set(['Mechanics', 'Tutors']);

const DEMO_PROVIDERS = [
  {
    id: 'demo_mech_1',
    name: 'Kasi Torque Auto & Diagnostics',
    category: 'Mechanics',
    location: 'Meadowlands, Soweto',
    price: 'From R350',
    phone: '27712345601',
    coverImage: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80',
    services: ['Brake Pads', 'Oil & Filter Service', 'OBD Diagnostics'],
    openingTime: '08:00',
    closingTime: '17:00',
    workingDays: ['2026-11-26', '2026-11-27', '2026-11-28', '2026-11-30'],
    timeSlots: ['08:00', '10:30', '13:00', '15:30'],
    growthUpdates: [
      {
        id: 'ms_init_1',
        title: 'Added Mobile Diagnostic Bay',
        story: 'Now offering on-site fault scanning across Soweto.',
        createdAt: '2026-11-01T08:00:00.000Z',
        responses: [],
      },
    ],
    ownerSessionEmail: 'torque@skawara.co.za',
    businessEmail: 'torque@skawara.co.za',
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'demo_tutor_1',
    name: 'Code & STEM Study Hub',
    category: 'Tutors',
    location: 'Potchefstroom',
    price: 'From R180/hr',
    phone: '27712345602',
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    services: ['Mathematics', 'Web & Software Dev', 'Exam Prep'],
    openingTime: '09:00',
    closingTime: '18:00',
    workingDays: ['2026-11-26', '2026-11-27', '2026-11-28', '2026-11-30'],
    timeSlots: ['09:00', '11:30', '14:00', '16:30'],
    growthUpdates: [
      {
        id: 'ms_init_2',
        title: 'Weekend Coding Bootcamps Open',
        story: 'Small-group sessions for JavaScript, SQL, and problem solving.',
        createdAt: '2026-11-02T08:00:00.000Z',
        responses: [],
      },
    ],
    ownerSessionEmail: 'studyhub@skawara.co.za',
    businessEmail: 'studyhub@skawara.co.za',
    createdAt: '2026-11-02T08:00:00.000Z',
  },
  {
    id: 'demo_groom_1',
    name: 'SharpFade Barbershop',
    category: 'Grooming',
    location: 'Centurion, Gauteng',
    price: 'From R120',
    phone: '27712345603',
    coverImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    services: ['Skin Fade', 'Beard Sculpt', 'Hot Towel Shave'],
    openingTime: '09:00',
    closingTime: '19:00',
    workingDays: ['2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27'],
    timeSlots: ['09:00', '11:00', '14:00', '16:00'],
    growthUpdates: [
      {
        id: 'ms_init_3',
        title: 'Extended Friday Hours',
        story: 'Open until 19:00 on Fridays for after-work cuts.',
        createdAt: '2026-11-03T08:00:00.000Z',
        responses: [],
      },
    ],
    ownerSessionEmail: 'sharpfade@skawara.co.za',
    businessEmail: 'sharpfade@skawara.co.za',
    createdAt: '2026-11-03T08:00:00.000Z',
  },
  {
    id: 'demo_beauty_1',
    name: 'Velvet Crown Nail & Brow Studio',
    category: 'Beauty',
    location: 'Pretoria',
    price: 'From R220',
    phone: '27712345604',
    coverImage: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
    services: ['Acrylic Extensions', 'Gel Overlay', 'Brow Tint & Shape'],
    openingTime: '08:30',
    closingTime: '17:30',
    workingDays: ['2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27'],
    timeSlots: ['09:00', '11:00', '14:00', '16:00'],
    growthUpdates: [
      {
        id: 'ms_init_4',
        title: 'Festive Season Slots Released',
        story: 'Early bookings open for December appointments.',
        createdAt: '2026-11-04T08:00:00.000Z',
        responses: [],
      },
    ],
    ownerSessionEmail: 'velvetcrown@skawara.co.za',
    businessEmail: 'velvetcrown@skawara.co.za',
    createdAt: '2026-11-04T08:00:00.000Z',
  },
  {
    id: 'demo_tech_1',
    name: 'CircuitFix Laptop & Phone Lab',
    category: 'Tech',
    location: 'Midrand, Gauteng',
    price: 'From R250',
    phone: '27712345605',
    coverImage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80',
    services: ['Screen Replacement', 'SSD & RAM Upgrade', 'Data Recovery'],
    openingTime: '09:00',
    closingTime: '17:00',
    workingDays: ['2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27'],
    timeSlots: ['09:00', '11:00', '14:00', '16:00'],
    growthUpdates: [
      {
        id: 'ms_init_5',
        title: 'Same-Day Battery Swaps',
        story: 'Most laptop and smartphone batteries replaced within 2 hours.',
        createdAt: '2026-11-05T08:00:00.000Z',
        responses: [],
      },
    ],
    ownerSessionEmail: 'circuitfix@skawara.co.za',
    businessEmail: 'circuitfix@skawara.co.za',
    createdAt: '2026-11-05T08:00:00.000Z',
  },
  {
    id: 'demo_food_1',
    name: 'Flame & Herb Kitchen',
    category: 'Food',
    location: 'Johannesburg',
    price: 'From R95',
    phone: '27712345606',
    coverImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    services: ['Grilled Platters', 'Meal Prep Boxes', 'Event Catering'],
    openingTime: '10:00',
    closingTime: '20:00',
    workingDays: ['2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27'],
    timeSlots: ['10:30', '12:30', '15:00', '18:00'],
    growthUpdates: [
      {
        id: 'ms_init_6',
        title: 'Weekly High-Protein Meal Packs',
        story: 'Pre-orderable lunches prepared fresh every Monday.',
        createdAt: '2026-11-06T08:00:00.000Z',
        responses: [],
      },
    ],
    ownerSessionEmail: 'flameherb@skawara.co.za',
    businessEmail: 'flameherb@skawara.co.za',
    createdAt: '2026-11-06T08:00:00.000Z',
  },
];

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const formatIsoDate = (date) => date.toISOString().split('T')[0];

export const formatWhatsAppNumber = (rawPhone) => {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('27')) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `27${digits.slice(1)}`;
  return digits;
};

export const getAllThreadMessages = () => readStorage(STORAGE_KEYS.THREADS, {});

export const getThreadMessages = (threadId) => {
  const threads = getAllThreadMessages();
  return threads[threadId] || [];
};

export const sendThreadMessage = (threadId, message) => {
  const threads = getAllThreadMessages();
  const current = threads[threadId] || [];
  const nextMessage =
    typeof message === 'string'
      ? { id: Date.now().toString(), text: message, createdAt: new Date().toISOString() }
      : { id: Date.now().toString(), createdAt: new Date().toISOString(), ...message };
  const updatedThreads = {
    ...threads,
    [threadId]: [...current, nextMessage],
  };
  writeStorage(STORAGE_KEYS.THREADS, updatedThreads);
  window.dispatchEvent(new CustomEvent('skawara:threads-updated'));
  return updatedThreads[threadId];
};

export const saveProviders = (providers) => {
  writeStorage(STORAGE_KEYS.PROVIDERS, providers);
};

export const getProviders = () => {
  const existing = readStorage(STORAGE_KEYS.PROVIDERS, null);
  if (!Array.isArray(existing) || existing.length === 0) {
    saveProviders(DEMO_PROVIDERS);
    return DEMO_PROVIDERS;
  }
  return existing;
};

export const getOwnedProviders = (providers = [], userEmail = '') => {
  const list = Array.isArray(providers) && providers.length > 0 ? providers : getProviders();
  const normalized = String(userEmail || '').trim().toLowerCase();
  if (!normalized) return [];

  return list.filter((p) => {
    const bizMail = String(p.businessEmail || '').trim().toLowerCase();
    const ownerMail = String(p.ownerSessionEmail || '').trim().toLowerCase();
    return bizMail === normalized || ownerMail === normalized;
  });
};

export const resetDemoProviders = () => {
  saveProviders(DEMO_PROVIDERS);
  window.dispatchEvent(new CustomEvent('skawara:providers-updated'));
  return DEMO_PROVIDERS;
};

export const getSavedProviderIds = (userEmail = '') => {
  const allSaved = readStorage(STORAGE_KEYS.SAVED_PROVIDERS, {});
  const key = String(userEmail || 'guest').trim().toLowerCase();
  return Array.isArray(allSaved[key]) ? allSaved[key] : [];
};

export const toggleSavedProvider = (providerId, userEmail = '') => {
  const allSaved = readStorage(STORAGE_KEYS.SAVED_PROVIDERS, {});
  const key = String(userEmail || 'guest').trim().toLowerCase();
  const current = new Set(Array.isArray(allSaved[key]) ? allSaved[key] : []);
  if (current.has(providerId)) {
    current.delete(providerId);
  } else {
    current.add(providerId);
  }
  const nextList = Array.from(current);
  writeStorage(STORAGE_KEYS.SAVED_PROVIDERS, { ...allSaved, [key]: nextList });
  window.dispatchEvent(new CustomEvent('skawara:saved-updated'));
  return nextList;
};

export const getBookings = () => readStorage(STORAGE_KEYS.BOOKINGS, []);

export const saveBooking = (booking) => {
  const bookings = getBookings();
  const updated = [...bookings, { id: Date.now().toString(), status: 'pending', ...booking }];
  writeStorage(STORAGE_KEYS.BOOKINGS, updated);
  window.dispatchEvent(new CustomEvent('skawara:bookings-updated'));
  return updated;
};

export const getNotifications = () => readStorage(STORAGE_KEYS.NOTIFICATIONS, []);

export const pushNotification = (title, message, meta = {}) => {
  const notifications = getNotifications();
  const nextNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    message,
    providerId: meta.providerId || null,
    providerName: meta.providerName || '',
    milestoneId: meta.milestoneId || null,
    bookingId: meta.bookingId || null,
    recipientRole: meta.recipientRole || null,
    recipientEmail: meta.recipientEmail || '',
    reminderKey: meta.reminderKey || null,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const updated = [nextNotification, ...notifications];
  writeStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
  window.dispatchEvent(new CustomEvent('skawara:notifications-updated'));
  return nextNotification;
};

export const markAllNotificationsRead = () => {
  const updated = getNotifications().map((n) => ({ ...n, read: true }));
  writeStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
  window.dispatchEvent(new CustomEvent('skawara:notifications-updated'));
  return updated;
};

export const deleteNotification = (notificationId) => {
  const updated = getNotifications().filter((n) => n.id !== notificationId);
  writeStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
  window.dispatchEvent(new CustomEvent('skawara:notifications-updated'));
  return updated;
};

export const pushBookingStatusAlert = (bookingId, status) => {
  const bookings = getBookings();
  const target = bookings.find((b) => b.id === bookingId);
  if (!target) return null;

  const statusLabel = status === 'confirmed' ? 'Confirmed' : 'Cancelled';
  const nextNotif = pushNotification(
    `Appointment ${statusLabel}`,
    `${target.providerName || 'Business'} marked ${target.service || 'your session'} on ${
      target.date || 'TBD'
    } at ${target.timeSlot || target.time || ''} as ${status}.`,
    {
      providerId: target.providerId || null,
      providerName: target.providerName || '',
      bookingId: target.id,
      recipientRole: 'client',
      recipientEmail: target.clientEmail || '',
    }
  );

  window.dispatchEvent(
    new CustomEvent('skawara:booking-status-alert', {
      detail: {
        booking: target,
        status,
        notification: nextNotif,
      },
    })
  );

  return nextNotif;
};

export const updateBookingStatus = (bookingId, status) => {
  const bookings = getBookings().map((b) =>
    b.id === bookingId ? { ...b, status } : b
  );
  writeStorage(STORAGE_KEYS.BOOKINGS, bookings);
  pushBookingStatusAlert(bookingId, status);
  window.dispatchEvent(new CustomEvent('skawara:bookings-updated'));
  return bookings;
};

export const cancelBooking = (bookingId) => updateBookingStatus(bookingId, 'cancelled');

export const scanUpcomingAppointmentAlerts = (userEmail = '') => {
  const bookings = getBookings();
  const existing = getNotifications();
  const existingKeys = new Set(existing.map((n) => n.reminderKey).filter(Boolean));
  const nowMs = Date.now();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const normalizedUser = String(userEmail || '').trim().toLowerCase();

  const created = [];

  bookings.forEach((bk) => {
    if (!bk || bk.status === 'cancelled' || !bk.date) return;
    const slotStr = bk.timeSlot || bk.time || '09:00';
    const apptDate = new Date(`${bk.date}T${slotStr}:00`);
    if (Number.isNaN(apptDate.getTime())) return;

    const diffMs = apptDate.getTime() - nowMs;
    if (diffMs < -30 * 60 * 1000 || diffMs > twentyFourHoursMs) return;

    const windowTag = diffMs <= twoHoursMs ? '2h' : '24h';
    const windowLabel = diffMs <= twoHoursMs ? 'in under 2 hours' : 'within 24 hours';

    const clientKey = `appt_${bk.id}_client_${windowTag}`;
    if (!existingKeys.has(clientKey)) {
      const clientEmail = String(bk.clientEmail || '').trim().toLowerCase();
      if (!normalizedUser || !clientEmail || clientEmail === normalizedUser) {
        const n = pushNotification(
          `Upcoming Appointment (${windowTag.toUpperCase()})`,
          `Reminder: ${bk.service || 'Session'} with ${bk.providerName || 'Provider'} on ${
            bk.date
          } at ${slotStr} is ${windowLabel}.`,
          {
            providerId: bk.providerId || null,
            providerName: bk.providerName || '',
            bookingId: bk.id,
            recipientRole: 'client',
            recipientEmail: bk.clientEmail || '',
            reminderKey: clientKey,
          }
        );
        existingKeys.add(clientKey);
        created.push(n);
      }
    }

    const bizKey = `appt_${bk.id}_business_${windowTag}`;
    if (!existingKeys.has(bizKey)) {
      const n = pushNotification(
        `Upcoming Client Booking (${windowTag.toUpperCase()})`,
        `Reminder: ${bk.clientName || bk.clientEmail || 'Client'} is booked for ${
          bk.service || 'Session'
        } on ${bk.date} at ${slotStr} (${windowLabel}).`,
        {
          providerId: bk.providerId || null,
          providerName: bk.providerName || '',
          bookingId: bk.id,
          recipientRole: 'business',
          reminderKey: bizKey,
        }
      );
      existingKeys.add(bizKey);
      created.push(n);
    }
  });

  if (created.length > 0) {
    window.dispatchEvent(
      new CustomEvent('skawara:upcoming-appointment', {
        detail: { alerts: created },
      })
    );
  }

  return created;
};

export const hasConfirmedBooking = (providerId, userEmail) => {
  if (!providerId || !userEmail) return false;
  const normalized = userEmail.trim().toLowerCase();
  return getBookings().some(
    (b) =>
      b.providerId === providerId &&
      b.status === 'confirmed' &&
      String(b.clientEmail || '').trim().toLowerCase() === normalized
  );
};

export const getProviderReviews = (providerId, viewerEmail = '', isBusinessOwner = false) => {
  const reviews = readStorage(STORAGE_KEYS.REVIEWS, []);
  const scoped = providerId ? reviews.filter((r) => r.providerId === providerId) : reviews;
  const normalizedViewer = String(viewerEmail || '').trim().toLowerCase();

  return scoped.filter((r) => {
    if (r.isPublic !== false) return true;
    if (isBusinessOwner) return true;
    const author = String(r.authorEmail || '').trim().toLowerCase();
    return Boolean(normalizedViewer && author === normalizedViewer);
  });
};

export const addAnonymousReview = (review) => {
  const reviews = readStorage(STORAGE_KEYS.REVIEWS, []);
  const authorEmail = String(review.authorEmail || '').trim();
  const isVerified = hasConfirmedBooking(review.providerId, authorEmail);

  const nextReview = {
    id: `rev_${Date.now()}`,
    providerId: review.providerId,
    authorLabel: review.authorLabel || 'Community Member',
    authorEmail,
    rating: Number(review.rating) || 5,
    service: review.service || '',
    comment: String(review.comment || '').trim(),
    isPublic: review.isPublic !== false,
    verifiedBooking: isVerified,
    reactions: { helpful: 0, recommend: 0 },
    replies: [],
    createdAt: new Date().toISOString(),
  };

  const updated = [nextReview, ...reviews];
  writeStorage(STORAGE_KEYS.REVIEWS, updated);
  window.dispatchEvent(new CustomEvent('skawara:reviews-updated'));
  return updated;
};

export const toggleReviewVisibility = (reviewId) => {
  const reviews = readStorage(STORAGE_KEYS.REVIEWS, []);
  const updated = reviews.map((r) =>
    r.id === reviewId ? { ...r, isPublic: r.isPublic === false } : r
  );
  writeStorage(STORAGE_KEYS.REVIEWS, updated);
  window.dispatchEvent(new CustomEvent('skawara:reviews-updated'));
  return updated;
};

export const reactToReview = (reviewId, reactionType = 'helpful') => {
  const reviews = readStorage(STORAGE_KEYS.REVIEWS, []);
  const updated = reviews.map((r) => {
    if (r.id !== reviewId) return r;
    const current = r.reactions || { helpful: 0, recommend: 0 };
    return {
      ...r,
      reactions: {
        ...current,
        [reactionType]: (current[reactionType] || 0) + 1,
      },
    };
  });
  writeStorage(STORAGE_KEYS.REVIEWS, updated);
  window.dispatchEvent(new CustomEvent('skawara:reviews-updated'));
  return updated;
};

export const replyToReview = ({ reviewId, senderName, role = 'business', text }) => {
  const cleanText = String(text || '').trim();
  if (!cleanText) return readStorage(STORAGE_KEYS.REVIEWS, []);

  const reviews = readStorage(STORAGE_KEYS.REVIEWS, []);
  const updated = reviews.map((r) => {
    if (r.id !== reviewId) return r;
    const nextReply = {
      id: `rep_${Date.now()}`,
      senderName: senderName || 'Business Owner',
      role,
      text: cleanText,
      createdAt: new Date().toISOString(),
    };
    return {
      ...r,
      replies: [...(r.replies || []), nextReply],
    };
  });

  writeStorage(STORAGE_KEYS.REVIEWS, updated);
  window.dispatchEvent(new CustomEvent('skawara:reviews-updated'));
  return updated;
};

export const logClientInteraction = (providerIdOrPayload, user, action) => {
  const interactions = readStorage(STORAGE_KEYS.INTERACTIONS, []);
  const entry =
    typeof providerIdOrPayload === 'object' && providerIdOrPayload !== null
      ? { id: Date.now().toString(), timestamp: new Date().toISOString(), ...providerIdOrPayload }
      : {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          providerId: providerIdOrPayload,
          userEmail: user?.email || 'guest',
          userName: user?.name || user?.email || 'Client',
          action,
        };
  const updated = [entry, ...interactions];
  writeStorage(STORAGE_KEYS.INTERACTIONS, updated);
  return updated;
};

export const getProviderInteractions = (providerId) => {
  const interactions = readStorage(STORAGE_KEYS.INTERACTIONS, []);
  return providerId
    ? interactions.filter((i) => i.providerId === providerId)
    : interactions;
};

export const addProviderMilestone = ({ providers = [], providerId, title, story }) => {
  const cleanTitle = String(title || '').trim();
  const cleanStory = String(story || '').trim();
  if (!cleanTitle) {
    return { updatedProviders: providers, milestone: null, targetProvider: null };
  }

  const milestone = {
    id: `ms_${Date.now()}`,
    title: cleanTitle,
    story: cleanStory,
    createdAt: new Date().toISOString(),
    responses: [],
  };

  let targetProvider = null;

  const updatedProviders = providers.map((p) => {
    if (p.id !== providerId) return p;
    targetProvider = p;
    return {
      ...p,
      growthUpdates: [milestone, ...(p.growthUpdates || [])],
    };
  });

  saveProviders(updatedProviders);

  const bizName = targetProvider?.name || 'Business';
  const bannerText = `${bizName} uploaded a new milestone: "${cleanTitle}"`;
  const nextNotif = pushNotification(
    'New Milestone Alert',
    `${bizName} posted "${cleanTitle}"${cleanStory ? ` — ${cleanStory}` : ''}`,
    {
      providerId,
      providerName: bizName,
      milestoneId: milestone.id,
    }
  );

  window.dispatchEvent(new CustomEvent('skawara:providers-updated'));
  window.dispatchEvent(
    new CustomEvent('skawara:milestone-alert', {
      detail: {
        bannerText,
        providerId,
        providerName: bizName,
        milestone,
        notification: nextNotif,
      },
    })
  );
  window.dispatchEvent(
    new CustomEvent('skawara:realtime-event', {
      detail: {
        title: nextNotif.title,
        message: nextNotif.message,
        notification: nextNotif,
      },
    })
  );

  return { updatedProviders, milestone, targetProvider };
};

export const respondToProviderMilestone = ({
  providers = [],
  providerId,
  milestoneId,
  user,
  reaction = 'Interested',
  comment = '',
}) => {
  const responderName = user?.name || user?.email || 'Client';
  const responderEmail = user?.email || 'client@skawara.co.za';
  const cleanComment = String(comment || '').trim();

  const responseEntry = {
    id: `resp_${Date.now()}`,
    responderName,
    responderEmail,
    reaction,
    comment: cleanComment,
    createdAt: new Date().toISOString(),
  };

  const updatedProviders = providers.map((p) => {
    if (p.id !== providerId) return p;
    const nextUpdates = (p.growthUpdates || []).map((u, idx) => {
      const matches = u.id === milestoneId || (!u.id && idx === 0);
      if (!matches) return u;
      return {
        ...u,
        responses: [...(u.responses || []), responseEntry],
      };
    });
    return { ...p, growthUpdates: nextUpdates };
  });

  saveProviders(updatedProviders);

  const summary = cleanComment
    ? `Milestone (${reaction}): "${cleanComment}"`
    : `Milestone Reaction: ${reaction}`;

  logClientInteraction(providerId, user, summary);

  window.dispatchEvent(new CustomEvent('skawara:providers-updated'));

  return { updatedProviders, responseEntry };
};

export const isAdvanceBookingRequired = (category) =>
  ADVANCE_BOOKING_CATEGORIES.has(category);

export const getAllowedAdvanceDateRange = () => {
  const now = new Date();
  const min = new Date(now);
  min.setDate(now.getDate() + 3);
  const max = new Date(now);
  max.setDate(now.getDate() + 7);
  return {
    minDate: formatIsoDate(min),
    maxDate: formatIsoDate(max),
  };
};

export const generateStrongPassword = (length = 12) => {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, (num) => chars[num % chars.length]).join('');
};

export const registerNewBusinessWithVisibility = ({
  providers = [],
  ownerSessionEmail,
  businessEmail,
  generatedPassword,
  name,
  category,
  location,
  price,
  phone,
  coverImage,
  servicesList,
  openingTime = '09:00',
  closingTime = '17:00',
  workingDays = [],
  timeSlots = ['09:00', '11:00', '14:00', '16:00'],
}) => {
  const services = Array.isArray(servicesList)
    ? servicesList.map((s) => s.trim()).filter(Boolean)
    : String(servicesList || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  const newEntry = {
    id: `biz_${Date.now()}`,
    name: name.trim(),
    category,
    location: location.trim(),
    price: price.trim(),
    phone: formatWhatsAppNumber(phone),
    coverImage: coverImage || '',
    services,
    openingTime,
    closingTime,
    workingDays,
    timeSlots,
    growthUpdates: [],
    ownerSessionEmail,
    businessEmail: (businessEmail || ownerSessionEmail || '').trim(),
    generatedPassword,
    createdAt: new Date().toISOString(),
  };

  const updatedProviders = [newEntry, ...providers];
  saveProviders(updatedProviders);

  const nextNotification = pushNotification(
    'New Business Live',
    `${newEntry.name} (${newEntry.category}) is now available in ${newEntry.location}.`,
    {
      providerId: newEntry.id,
      providerName: newEntry.name,
    }
  );

  window.dispatchEvent(new CustomEvent('skawara:providers-updated'));
  window.dispatchEvent(
    new CustomEvent('skawara:new-business-alert', {
      detail: {
        bannerText: `${newEntry.name} in ${newEntry.location} just joined for ${newEntry.category}.`,
        provider: newEntry,
        notification: nextNotification,
      },
    })
  );
  window.dispatchEvent(
    new CustomEvent('skawara:realtime-event', {
      detail: {
        title: nextNotification.title,
        message: nextNotification.message,
        notification: nextNotification,
      },
    })
  );

  return { newEntry, updatedProviders };
};