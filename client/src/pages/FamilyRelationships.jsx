import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '../services/notificationService';
import { useAuth } from '../context/useAuth';

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
            return result;
          }, (result) => `Invitation created. Share this one-time token with your family member: ${result.token}`);
        }}>
          <h2 className="text-xl font-semibold">Invite a family member</h2>
          <div className="flex gap-3">
            <input className="border rounded-xl px-3 py-2 flex-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="family@example.com" />
            <button className="bg-blue-600 text-white rounded-xl px-5 py-2">Create invitation</button>
          </div>
        </form>
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
