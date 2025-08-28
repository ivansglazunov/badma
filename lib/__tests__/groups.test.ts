import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { createApolloClient } from 'hasyx/lib/apollo/apollo';
import { Hasyx } from 'hasyx/lib/hasyx/hasyx';
import { Generator } from 'hasyx/lib/generator';
import schema from '../../public/hasura-schema.json';
import { createTestUser } from 'hasyx/lib/create-test-user';

dotenv.config();

const admin = new Hasyx(createApolloClient({
  url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL,
  secret: process.env.HASURA_ADMIN_SECRET,
}), Generator(schema));

const users: string[] = [];
const clubs: string[] = [];
const schools: string[] = [];

/** Helper to create a group of given kind and title, returns group id */
async function createGroup(kind: 'club' | 'school', title: string): Promise<string> {
  const res = await admin.insert({
    table: 'groups',
    object: { kind, title },
    returning: ['id'],
  });
  const id = (res as any)?.id || (Array.isArray(res) && res[0]?.id) || (res as any)?.returning?.[0]?.id;
  if (!id) throw new Error('Failed to create group');
  return id as string;
}

/** Helper to request/join membership */
async function joinGroup(groupId: string, userId: string) {
  return admin.insert({
    table: 'memberships',
    object: { group_id: groupId, user_id: userId },
    returning: ['id', 'status'],
    role: 'admin',
  });
}

/** Helper to update membership status */
async function updateMembership(id: string, status: string) {
  return admin.update({
    table: 'memberships',
    where: { id: { _eq: id } },
    _set: { status },
    returning: ['id', 'status'],
    role: 'admin',
  });
}

/** Fetch memberships for a user and kind */
async function fetchMembershipsByKind(userId: string, kind: 'club' | 'school') {
  return admin.select({
    table: 'memberships',
    where: {
      user_id: { _eq: userId },
      group: { kind: { _eq: kind } },
    },
    returning: ['id', 'status', { group: ['id', 'kind', 'title'] }],
    role: 'admin',
  });
}

describe('Groups one-active-membership-per-kind', () => {
  it('user can join one club, but not a second; can join one school, but not a second; can leave and join another', async () => {
    // Create user
    const u = await createTestUser();
    const userId = u.id as string;
    users.push(userId);

    // Create two clubs and two schools
    const clubA = await createGroup('club', `Club-A-${uuidv4().slice(0,8)}`);
    const clubB = await createGroup('club', `Club-B-${uuidv4().slice(0,8)}`);
    const schoolA = await createGroup('school', `School-A-${uuidv4().slice(0,8)}`);
    const schoolB = await createGroup('school', `School-B-${uuidv4().slice(0,8)}`);
    clubs.push(clubA, clubB);
    schools.push(schoolA, schoolB);

    // Join first club (should succeed -> request or approved depending on policy)
    const m1 = await joinGroup(clubA, userId);
    expect(m1).toBeTruthy();

    // Try to join second club -> should fail by trigger
    let clubJoinError: any = null;
    try { await joinGroup(clubB, userId); } catch (e: any) { clubJoinError = e; }
    expect(clubJoinError).toBeTruthy();

    // Join first school (should succeed)
    const s1 = await joinGroup(schoolA, userId);
    expect(s1).toBeTruthy();

    // Try to join second school -> should fail
    let schoolJoinError: any = null;
    try { await joinGroup(schoolB, userId); } catch (e: any) { schoolJoinError = e; }
    expect(schoolJoinError).toBeTruthy();

    // Leave the club: find membership id and set status='left'
    const clubMemberships: any[] = (await fetchMembershipsByKind(userId, 'club')) as any[];
    const activeClub = (Array.isArray(clubMemberships) ? clubMemberships : (clubMemberships as any)?.memberships || []).find((m: any) => ['approved','request'].includes(m.status));
    expect(activeClub).toBeTruthy();
    await updateMembership(activeClub.id, 'left');

    // Now join another club (should succeed)
    const m2 = await joinGroup(clubB, userId);
    expect(m2).toBeTruthy();
  }, 120000);

  afterAll(async () => {
    // Cleanup memberships and groups and users
    try {
      // Delete memberships by groups
      for (const gid of [...clubs, ...schools]) {
        await admin.delete({ table: 'memberships', where: { group_id: { _eq: gid } } });
      }
      // Delete groups
      for (const gid of clubs) {
        await admin.delete({ table: 'groups', where: { id: { _eq: gid } } });
      }
      for (const gid of schools) {
        await admin.delete({ table: 'groups', where: { id: { _eq: gid } } });
      }
      // Delete users
      for (const uid of users) {
        await admin.delete({ table: 'users', where: { id: { _eq: uid } } });
      }
    } catch (e) {
      // Best-effort cleanup
    }
  });
});
