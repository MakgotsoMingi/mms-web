import React, { useState, useEffect, useCallback } from 'react';
import { getProviderReviews, addAnonymousReview } from '../utlis/storage';

export default function AnonymousReviewsSection({ provider, user, compact = false }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const loadReviews = useCallback(() => {
    setReviews(getProviderReviews(provider.id));
  }, [provider.id]);

  useEffect(() => {
    loadReviews();

    const handleReviewUpdate = (e) => {
      if (!e.detail?.providerId || e.detail.providerId === provider.id) {
        loadReviews();
      }
    };

    const handleStorage = (e) => {
      if (e.key === 'skawara_reviews_v2') {
        loadReviews();
      }
    };

    window.addEventListener('skawara:reviews-updated', handleReviewUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('skawara:reviews-updated', handleReviewUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadReviews, provider.id]);

  const averageScore =
    reviews.length > 0
      ? (reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length).toFixed(1)
      : 'New';

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    addAnonymousReview({
      providerId: provider.id,
      providerName: provider.name,
      rating,
      comment,
      user
    });

    setComment('');
    setRating(5);
    setConfirmation('Published publicly with your identity kept anonymous.');
    setTimeout(() => setConfirmation(''), 3000);
    loadReviews();
  };

  return (
    <div className={`reviews-box ${compact ? 'reviews-compact' : ''}`}>
      <div className="reviews-header">
        <h4>Public Client Reviews</h4>
        <span className="rating-pill">
          ★ {averageScore} ({reviews.length})
        </span>
      </div>

      {!compact && (
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-form-row">
            <label>
              Rating:
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                <option value={5}>5 ★ - Excellent</option>
                <option value={4}>4 ★ - Good</option>
                <option value={3}>3 ★ - Fair</option>
                <option value={2}>2 ★ - Poor</option>
                <option value={1}>1 ★ - Bad</option>
              </select>
            </label>
            <span className="anon-hint">Public name: Anonymous / Masked</span>
          </div>

          <textarea
            rows="2"
            placeholder="Share your experience with this business..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />

          <button type="submit" className="btn-primary-small">
            Post Anonymous Review
          </button>
          {confirmation && <p className="review-confirm-text">{confirmation}</p>}
        </form>
      )}

      <div className="reviews-feed">
        {reviews.length === 0 ? (
          <p className="muted-text">No public reviews yet.</p>
        ) : (
          (compact ? reviews.slice(0, 2) : reviews).map((rev) => (
            <div key={rev.id} className="review-item">
              <div className="review-item-top">
                <span className="anon-author">{rev.anonymousAuthor}</span>
                <span className="review-stars">
                  {'★'.repeat(rev.rating)}
                  {'☆'.repeat(5 - rev.rating)}
                </span>
              </div>
              <p>{rev.comment}</p>
              <small>{rev.createdAt}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}