import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button, Card, Input } from '../components/UI';
import { Shield, FileText, Bell, LogOut, Copy, Check, Upload, CreditCard } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { db } from '../services/firebase';

export const Settings = () => {
  const { profile, logout } = useAuth();
  const { depositToLive } = useData();
  const [copied, setCopied] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  
  // KYC State
  const [kycStep, setKycStep] = useState(0); // 0: None, 1: Form
  const [fileStatus, setFileStatus] = useState<any>({});

  const copyReferral = () => {
    navigator.clipboard.writeText(`https://wisecrypto.app/invite/${profile?.tradingId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatedUpload = (field: string) => {
    setFileStatus((prev: any) => ({ ...prev, [field]: 'uploaded' }));
  };

  const submitKYC = async () => {
    if (profile) {
      await update(ref(db, `users/${profile.uid}`), { kycStatus: 'pending' });
      alert("KYC Submitted for verification!");
      setKycStep(0);
    }
  };

  const handleDeposit = () => {
      const amount = parseFloat(depositAmount);
      if(amount > 0) {
          depositToLive(amount);
          setDepositAmount('');
          alert("Payment Successful! Funds added to Live Account.");
      }
  }

  if (!profile) return null;

  return (
    <div className="p-5 space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* Profile Card */}
      <Card className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-dark-700 overflow-hidden">
          <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg">{profile.name}</h3>
          <p className="text-gray-400 text-sm">{profile.email}</p>
          <div className="text-xs text-primary mt-1">ID: {profile.tradingId}</div>
        </div>
      </Card>

      {/* Live Account Funding */}
      <Card>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CreditCard size={18} /> Deposit Funds (Live)
        </h3>
        <div className="flex gap-2">
            <Input 
                type="number" 
                placeholder="Amount (USD)" 
                value={depositAmount} 
                onChange={(e) => setDepositAmount(e.target.value)} 
            />
            <Button onClick={handleDeposit} disabled={!depositAmount}>Add</Button>
        </div>
        <p className="text-[10px] text-gray-500 mt-2">Secure payment via simulated gateway.</p>
      </Card>

      {/* KYC Section */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield size={18} className="text-primary" /> Identity Verification
          </h3>
          <span className={`text-xs px-2 py-1 rounded capitalize ${
            profile.kycStatus === 'approved' ? 'bg-green-500/20 text-green-500' :
            profile.kycStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
            'bg-red-500/20 text-red-500'
          }`}>
            {profile.kycStatus}
          </span>
        </div>
        
        {profile.kycStatus === 'none' && kycStep === 0 && (
          <Button fullWidth onClick={() => setKycStep(1)}>Complete KYC</Button>
        )}

        {kycStep === 1 && (
          <div className="space-y-4">
            {['Pan Card', 'Aadhar Front', 'Aadhar Back', 'Selfie'].map(field => (
              <div key={field} className="flex justify-between items-center border border-dashed border-gray-600 p-3 rounded-lg">
                <span className="text-sm text-gray-300">{field}</span>
                {fileStatus[field] ? (
                  <Check size={18} className="text-primary" />
                ) : (
                  <label className="cursor-pointer">
                    <input type="file" className="hidden" onChange={() => handleSimulatedUpload(field)} />
                    <Upload size={18} className="text-gray-400" />
                  </label>
                )}
              </div>
            ))}
            <Button fullWidth onClick={submitKYC} disabled={Object.keys(fileStatus).length < 4}>
              Submit Documents
            </Button>
          </div>
        )}
      </Card>

      {/* Referral */}
      <Card>
        <h3 className="font-semibold mb-2 flex items-center gap-2">Refer & Earn</h3>
        <p className="text-xs text-gray-400 mb-3">Invite friends and earn 10% of their trading fees.</p>
        <div className="bg-black/30 p-3 rounded-lg flex justify-between items-center">
          <span className="text-sm text-gray-300 truncate mr-2">wisecrypto.app/invite/{profile.tradingId}</span>
          <button onClick={copyReferral}>
            {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
          </button>
        </div>
      </Card>

      {/* Notifications */}
      <div className="space-y-2">
        <div className="flex justify-between items-center p-3 glass rounded-xl">
          <span className="flex items-center gap-3">
            <Bell size={18} /> Push Notifications
          </span>
          <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
            <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      <Button variant="danger" fullWidth onClick={logout} className="mt-4">
        <LogOut size={18} /> Log Out
      </Button>
    </div>
  );
};