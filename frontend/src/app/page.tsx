'use client';

import Link from 'next/link';
import { ArrowRight, Shield, TrendingUp, Users, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import OathCard from '@/components/OathCard';
import { useOathData } from '@/hooks/useOathData';
import { protocolStats } from '@/lib/mockData';
import { formatCurrency } from '@/utils/format';
import { OathStatus } from '@/types/oath';

export default function HomePage() {
  const { oaths, hasRealData } = useOathData();
  
  // Get featured oaths (active ones with high collateral)
  const featuredOaths = oaths
    .filter(oath => oath.status === OathStatus.Active)
    .sort((a, b) => {
      const aCollateral = a.collateralTokens.reduce((sum, token) => sum + token.usdValue, 0);
      const bCollateral = b.collateralTokens.reduce((sum, token) => sum + token.usdValue, 0);
      return bCollateral - aCollateral;
    })
    .slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                <Shield className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Price Your Promises,<br />
              <span className="text-gold-400">Guard Your Reputation</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Transform intangible commitments into verifiable on-chain assets. 
              OATH creates economic accountability for DeFi vault managers on Aptos.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/oaths" 
                className="btn-gold text-lg px-8 py-4 flex items-center space-x-2 group"
              >
                <span>Explore Oaths</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/create" 
                className="btn text-lg px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
              >
                Make a Vow
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Protocol Statistics
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Real-time metrics showing the trust and value secured through OATH commitments
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Value Vowed"
              value={formatCurrency(protocolStats.totalValueVowed)}
              subtitle="TVV across all oaths"
              icon={<DollarSign className="h-6 w-6" />}
              color="primary"
              trend={{ value: 12.5, label: "vs last month", isPositive: true }}
            />
            
            <StatsCard
              title="Active Oaths"
              value={protocolStats.activeOaths}
              subtitle="Currently monitored"
              icon={<Shield className="h-6 w-6" />}
              color="success"
            />
            
            <StatsCard
              title="Completed Successfully"
              value={protocolStats.completedOaths}
              subtitle="Fulfilled commitments"
              icon={<CheckCircle className="h-6 w-6" />}
              color="gold"
            />
            
            <StatsCard
              title="Total Compensation"
              value={formatCurrency(protocolStats.totalCompensationPaid)}
              subtitle="Paid to affected users"
              icon={<AlertTriangle className="h-6 w-6" />}
              color="danger"
            />
          </div>
        </div>
      </section>

      {/* Featured Oaths Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Featured Oaths
              </h2>
              <p className="text-gray-600">
                High-value commitments from trusted vault managers
              </p>
            </div>
            
            <Link 
              href="/oaths" 
              className="btn-primary flex items-center space-x-2"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredOaths.map((oath) => (
              <OathCard key={oath.id} oath={oath} />
            ))}
          </div>
          {hasRealData && (
            <div className="mt-6 text-center">
              <p className="text-sm text-green-600">
                ✓ Showing live on-chain oath data
              </p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How OATH Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple steps to create economic accountability in DeFi
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Make Your Vow
              </h3>
              <p className="text-gray-600">
                Stake collateral and commit to specific performance metrics 
                for your vault or project.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-success-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Get Monitored
              </h3>
              <p className="text-gray-600">
                Our oracle system continuously tracks your performance 
                against your committed metrics.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gold-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gold-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Build Trust
              </h3>
              <p className="text-gray-600">
                Successful oaths build your reputation, while failures 
                compensate affected users from your collateral.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 gradient-bg text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Build Trust in DeFi?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the future of accountable yield farming on Aptos
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/create" 
              className="btn-gold text-lg px-8 py-4"
            >
              Create Your First Oath
            </Link>
            
            <Link 
              href="/vaults" 
              className="btn text-lg px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
            >
              Explore Vaults
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 