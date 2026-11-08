import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '../services/notificationService';
import { useAuth } from '../context/useAuth';
import { Check, Copy } from 'lucide-react';

const permissionNames = ['wellness_summaries', 'checkin_updates', 'notifications_enabled', 'view_reminders'];

export default function FamilyRelationships() {
  const { user } = useAuth();
  const isElderly = user?.accountType === 'elderly';
  const [relationships, setRelationships] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [createdInvitation, setCreatedInvitation] = useState(null);
  const [copied, setCopied] = useState('');
  const [familyConsent, setFamilyConsent] = useState(null);

  const load = async () => {
    try {
      setError('');
      const [linked, pending] = await Promise.all([
        notificationService.listRelationships(),
        notificationService.listInvitations(),
      ]);
      setRelationships(linked);
      setInvitations(pending);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load family relationships.');
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!isElderly) return;
    notificationService.getFamilyConsent()
      .then(setFamilyConsent)
      .catch((err) => setError(err.response?.data?.detail || 'Unable to load family sharing consent.'));
  }, [isElderly]);

  const copyText = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(''), 2000);
    } catch {
      setError('Copy failed. Please select and copy the invitation manually.');
    }
  };

  const run = async (action, success) => {
    try {
      setError('');
      const result = await action();
      setMessage(typeof success === 'function' ? success(result) : success);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'The relationship action could not be completed.');
    }
  };

  const toggleFamilySharing = async (enabled) => {
    if (!familyConsent) return;
    try {
      setError('');
      const updated = await notificationService.updateFamilyConsent({
        enabled,
        preferences: familyConsent.preferences,
      });
      setFamilyConsent(updated);
      setMessage(enabled
        ? 'Family sharing is enabled. Your accepted family member can now view permitted updates.'
        : 'Family sharing is disabled.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update family sharing consent.');
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div>
        <Link to={isElderly ? '/dashboard' : '/family'} className="text-sm text-blue-600">Back to dashboard</Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-3">Family relationships</h1>
        <p className="text-slate-600 mt-1">Manage active links, permissions, consent, and pending invitations.</p>
      </div>
      {message && <p className="p-3 rounded-xl bg-emerald-50 text-emerald-700">{message}</p>}
      {error && <p className="p-3 rounded-xl bg-red-50 text-red-700">{error}</p>}

      {isElderly && (
        <form className="bg-white rounded-2xl p-6 shadow-sm space-y-3" onSubmit={(event) => {
          event.preventDefault();
          run(async () => {
            const result = await notificationService.inviteFamily({ family_email: email, relationship_type: 'family' });
            setEmail('');
            setCreatedInvitation(result);
            return result;
          }, 'Invitation created. Copy the one-time token below and send it to your family member.');
        }}>
          <h2 className="text-xl font-semibold">Invite a family member</h2>
          <div className="flex gap-3">
            <input className="border rounded-xl px-3 py-2 flex-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="family@example.com" />
            <button className="bg-blue-600 text-white rounded-xl px-5 py-2">Create invitation</button>
          </div>
        </form>
      )}

      {isElderly && createdInvitation?.token && (
        <section className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-blue-950">Invitation token ready to share</h2>
          <p className="text-sm text-blue-900">
            Send this token to the family member you invited. It can only be shown now and expires on{' '}
            {new Date(createdInvitation.expires_at).toLocaleString()}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <code className="flex-1 break-all rounded-xl bg-white border border-blue-200 px-4 py-3 text-sm text-slate-800">
              {createdInvitation.token}
            </code>
            <button
              type="button"
              onClick={() => copyText(createdInvitation.token, 'token')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
            >
              {copied === 'token' ? <Check size={17} /> : <Copy size={17} />}
              {copied === 'token' ? 'Copied' : 'Copy token'}
            </button>
            <button
              type="button"
              onClick={() => copyText(`Saanidhya family invitation token: ${createdInvitation.token}`, 'message')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-3 font-semibold text-blue-800"
            >
              {copied === 'message' ? <Check size={17} /> : <Copy size={17} />}
              {copied === 'message' ? 'Copied' : 'Copy message'}
            </button>
          </div>
        </section>
      )}

      {isElderly && familyConsent && (
        <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Family sharing consent</h2>
            <p className="mt-1 text-sm text-slate-600">
              Accepting an invitation creates the relationship, but your information remains private until you enable sharing.
            </p>
          </div>
          <label className="flex items-start gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(familyConsent.enabled)}
              onChange={(event) => toggleFamilySharing(event.target.checked)}
              className="mt-1 h-5 w-5 accent-blue-600"
            />
            <span>
              Allow linked family members to access the information selected below.
              {!familyConsent.enabled && (
                <span className="block mt-1 text-amber-700">
                  Family dashboard requests will show “Family sharing consent is disabled” until this is enabled.
                </span>
              )}
            </span>
          </label>
        </section>
      )}

      {!isElderly && (
        <form className="bg-white rounded-2xl p-6 shadow-sm space-y-3" onSubmit={(event) => {
          event.preventDefault();
          run(async () => { await notificationService.acceptInvitation(token); setToken(''); }, 'Invitation accepted.');
        }}>
          <h2 className="text-xl font-semibold">Accept an invitation</h2>
          <div className="flex gap-3">
            <input className="border rounded-xl px-3 py-2 flex-1" required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste invitation token" />
            <button className="bg-blue-600 text-white rounded-xl px-5 py-2">Accept</button>
          </div>
        </form>
      )}

      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Active relationships</h2>
        {relationships.length === 0 ? <p className="text-slate-500">No active relationships.</p> : relationships.map((relationship) => (
          <div key={relationship.id} className="border-t py-4 flex flex-col gap-3">
            <div className="flex justify-between">
              <span>{isElderly ? `Family member ${relationship.family_user_id}` : `Senior ${relationship.elderly_user_id}`}</span>
              <button className="text-red-600" onClick={() => run(() => notificationService.revokeRelationship(relationship.id), 'Relationship revoked.')}>Revoke</button>
            </div>
            {isElderly && <div className="flex flex-wrap gap-3 text-sm">
              {permissionNames.map((permission) => (
                <label key={permission} className="flex gap-1 items-center">
                  <input type="checkbox" checked={Boolean(relationship.permissions?.[permission])} onChange={(event) => run(
                    () => notificationService.updatePermissions(relationship.id, { [permission]: event.target.checked }),
                    'Permissions updated.',
                  )} />
                  {permission.replaceAll('_', ' ')}
                </label>
              ))}
            </div>}
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Pending invitations</h2>
        {invitations.length === 0 ? <p className="text-slate-500">No pending invitations.</p> : invitations.map((invitation) => (
          <div key={invitation.id} className="border-t py-3 flex justify-between">
            <span>{isElderly ? `To family ${invitation.family_user_id}` : `From senior ${invitation.elderly_user_id}`} ({invitation.status})</span>
            {!isElderly && <button className="text-red-600" onClick={() => run(() => notificationService.rejectInvitation(token), 'Invitation rejected.')}>Reject using entered token</button>}
          </div>
        ))}
      </section>
    </main>
  );
}
