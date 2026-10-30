import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAvatarUrl } from '../api/client.js';
import { UserIcon } from '../components/icons.jsx';
import {
  acceptContactRequest,
  createContactRequest,
  deleteContact,
  getContacts,
  getIncomingContactRequests,
  rejectContactRequest,
  searchUsers,
} from '../api/contacts.js';
import './FriendsPage.css';

const SEARCH_DELAY_MS = 350;

function EmptyState({ children }) {
  return <p className="friends-page__empty">{children}</p>;
}

function UserIdentity({ user }) {
  const [imgFailed, setImgFailed] = useState(false);
  const avatarSrc = getAvatarUrl(user.avatar_url, user.updated_at);
  return (
    <div className="friends-page__identity">
      <div className="friends-page__avatar">
        {avatarSrc && !imgFailed ? (
          <img
            alt=""
            className="friends-page__avatar-img"
            onError={() => setImgFailed(true)}
            src={avatarSrc}
          />
        ) : (
          <UserIcon />
        )}
      </div>
      <div className="friends-page__identity-text">
        <span>{user.display_name}</span>
        <strong>@{user.login}</strong>
      </div>
    </div>
  );
}

function FriendsPage({ onError, onNotify, onShareContact, token }) {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [contactPendingDeleteId, setContactPendingDeleteId] = useState('');

  const contactIds = useMemo(() => new Set(contacts.map((contact) => contact.id)), [contacts]);

  const loadFriendsData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [nextContacts, nextRequests] = await Promise.all([
        getContacts(token),
        getIncomingContactRequests(token),
      ]);
      setContacts(nextContacts);
      setIncomingRequests(nextRequests);
    } catch (error) {
      onError(error);
    } finally {
      setIsLoading(false);
    }
  }, [onError, token]);

  useEffect(() => {
    loadFriendsData();
  }, [loadFriendsData]);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return undefined;
    }

    setIsSearching(true);
    const searchTimeout = window.setTimeout(() => {
      searchUsers(normalizedQuery, token)
        .then(setSearchResults)
        .catch(onError)
        .finally(() => setIsSearching(false));
    }, SEARCH_DELAY_MS);

    return () => window.clearTimeout(searchTimeout);
  }, [onError, query, token]);

  const handleCreateRequest = async (user) => {
    setBusyId(user.id);

    try {
      await createContactRequest(user.id, token);
      onNotify(t('friends.request_sent', { name: user.display_name, defaultValue: `Friend request sent to ${user.display_name}` }));
      setSearchResults((current) => current.filter((item) => item.id !== user.id));
    } catch (error) {
      onError(error);
    } finally {
      setBusyId('');
    }
  };

  const handleAcceptRequest = async (request) => {
    setBusyId(request.id);

    try {
      await acceptContactRequest(request.id, token);
      onNotify(t('friends.added_to_friends', { name: request.from_user.display_name, defaultValue: `${request.from_user.display_name} added to friends` }));
      await loadFriendsData();
    } catch (error) {
      onError(error);
    } finally {
      setBusyId('');
    }
  };

  const handleRejectRequest = async (request) => {
    setBusyId(request.id);

    try {
      await rejectContactRequest(request.id, token);
      setIncomingRequests((current) => current.filter((item) => item.id !== request.id));
      onNotify(t('friends.request_declined', { name: request.from_user.display_name, defaultValue: `Request from ${request.from_user.display_name} declined` }));
    } catch (error) {
      onError(error);
    } finally {
      setBusyId('');
    }
  };

  const handleRequestDeleteContact = (contact) => {
    setContactPendingDeleteId(contact.id);
  };

  const handleCancelDeleteContact = () => {
    setContactPendingDeleteId('');
  };

  const handleConfirmDeleteContact = async (contact) => {
    setBusyId(contact.id);

    try {
      await deleteContact(contact.id, token);
      setContacts((current) => current.filter((item) => item.id !== contact.id));
      setContactPendingDeleteId('');
      onNotify(t('friends.removed_from_friends', { name: contact.display_name, defaultValue: `${contact.display_name} removed from friends` }));
    } catch (error) {
      onError(error);
    } finally {
      setBusyId('');
    }
  };

  const handleShareContact = async (contact) => {
    if (!onShareContact) return;

    setBusyId(contact.id);

    try {
      await onShareContact(contact);
    } finally {
      setBusyId('');
    }
  };

  const filteredSearchResults = searchResults.filter((user) => !contactIds.has(user.id));

  return (
    <section className="friends-page glass-panel" aria-busy={isLoading}>
      <div className="friends-page__hero">
        <div>
          <p className="friends-page__eyebrow">{t('friends.contacts_eyebrow')}</p>
          <h1>{t('friends.title')}</h1>
        </div>
        <button className="friends-page__refresh" disabled={isLoading} onClick={loadFriendsData} type="button">
          {t('friends.refresh', { defaultValue: 'Refresh' })}
        </button>
      </div>

      <div className="friends-page__grid">
        <section className="friends-page__panel friends-page__panel--wide">
          <div className="friends-page__section-head">
            <h2>{t('friends.add_friend_title')}</h2>
            <span>{isSearching ? t('friends.searching', { defaultValue: 'Searching...' }) : t('friends.found', { count: filteredSearchResults.length, defaultValue: `${filteredSearchResults.length} found` })}</span>
          </div>
          <input
            className="friends-page__search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('friends.search_placeholder')}
            type="search"
            value={query}
          />

          <div className="friends-page__list">
            {query.trim() && !isSearching && !filteredSearchResults.length ? (
              <EmptyState>{t('friends.no_users_found')}</EmptyState>
            ) : null}

            {filteredSearchResults.map((user) => (
              <article className="friends-page__item" key={user.id}>
                <UserIdentity user={user} />
                <button
                  className="friends-page__button friends-page__button--primary"
                  disabled={busyId === user.id}
                  onClick={() => handleCreateRequest(user)}
                  type="button"
                >
                  {t('friends.add_btn', { defaultValue: 'Add' })}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="friends-page__panel">
          <div className="friends-page__section-head">
            <h2>{t('friends.incoming_title')}</h2>
            <span>{incomingRequests.length}</span>
          </div>

          <div className="friends-page__list">
            {!incomingRequests.length ? <EmptyState>{t('friends.no_pending_requests')}</EmptyState> : null}

            {incomingRequests.map((request) => (
              <article className="friends-page__item friends-page__item--stacked" key={request.id}>
                <UserIdentity user={request.from_user} />
                <div className="friends-page__actions">
                  <button
                    className="friends-page__button friends-page__button--primary"
                    disabled={busyId === request.id}
                    onClick={() => handleAcceptRequest(request)}
                    type="button"
                  >
                    {t('friends.accept_btn', { defaultValue: 'Accept' })}
                  </button>
                  <button
                    className="friends-page__button"
                    disabled={busyId === request.id}
                    onClick={() => handleRejectRequest(request)}
                    type="button"
                  >
                    {t('friends.decline_btn', { defaultValue: 'Decline' })}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="friends-page__panel">
          <div className="friends-page__section-head">
            <h2>{t('friends.your_friends_title')}</h2>
            <span>{contacts.length}</span>
          </div>

          <div className="friends-page__list">
            {!contacts.length ? <EmptyState>{t('friends.your_contacts_empty')}</EmptyState> : null}

            {contacts.map((contact) => (
              <article
                className={`friends-page__item${contactPendingDeleteId === contact.id ? ' friends-page__item--confirm' : ''}`}
                key={contact.id}
              >
                <UserIdentity user={contact} />
                {contactPendingDeleteId === contact.id ? (
                  <div className="friends-page__confirm">
                    <p>{t('friends.remove_confirm_text')}</p>
                    <div className="friends-page__actions">
                      <button
                        className="friends-page__button friends-page__button--danger"
                        disabled={busyId === contact.id}
                        onClick={() => handleConfirmDeleteContact(contact)}
                        type="button"
                      >
                        {t('friends.remove_btn', { defaultValue: 'Remove' })}
                      </button>
                      <button
                        className="friends-page__button"
                        disabled={busyId === contact.id}
                        onClick={handleCancelDeleteContact}
                        type="button"
                      >
                        {t('friends.cancel_btn', { defaultValue: 'Cancel' })}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="friends-page__actions">
                    <button
                      className="friends-page__button friends-page__button--primary"
                      disabled={busyId === contact.id || !onShareContact}
                      onClick={() => handleShareContact(contact)}
                      type="button"
                    >
                      {t('friends.share_btn', { defaultValue: 'Share' })}
                    </button>
                    <button
                      className="friends-page__button"
                      disabled={busyId === contact.id}
                      onClick={() => handleRequestDeleteContact(contact)}
                      type="button"
                    >
                      {t('friends.remove_btn', { defaultValue: 'Remove' })}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default FriendsPage;
