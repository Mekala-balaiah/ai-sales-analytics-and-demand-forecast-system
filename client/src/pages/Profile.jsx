import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const { activeBusiness } = useContext(BusinessContext);

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 className="mb-4">User Profile</h1>
            <div className="glass-panel mb-4">
                <h3 className="mb-3" style={{ color: 'var(--accent-color)'}}>Account Details</h3>
                <p><strong>Name:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
            </div>

            <div className="glass-panel mb-4">
                <h3 className="mb-3" style={{ color: 'var(--accent-purple)'}}>Current Workspace</h3>
                <p><strong>Business Name:</strong> {activeBusiness?.businessName}</p>
                <p><strong>Industry:</strong> {activeBusiness?.industryType}</p>
            </div>

            <button className="btn-secondary" onClick={logout} style={{ width: '100%', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
                Sign Out / Logout
            </button>
        </div>
    );
};

export default Profile;
