'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/ui/back-button';
import {
  Plus,
  Search,
  Building2,
  DollarSign,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercentage, formatCompactNumber } from '@/lib/financial-calculations';

type Property = {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  assetType: string;
  developmentStage: string;
  units: number | null;
  purchasePrice: number;
  totalProjectCost: number;
  equityInvested: number;
  targetIRR: number | null;
  statusIndicator: string;
  project?: {
    name: string;
    projectNumber: string;
  };
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, assetTypeFilter, stageFilter]);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.city.toLowerCase().includes(term) ||
          p.state.toLowerCase().includes(term)
      );
    }

    if (assetTypeFilter !== 'all') {
      filtered = filtered.filter((p) => p.assetType === assetTypeFilter);
    }

    if (stageFilter !== 'all') {
      filtered = filtered.filter((p) => p.developmentStage === stageFilter);
    }

    setFilteredProperties(filtered);
  };

  const getAssetTypeDisplay = (type: string) => {
    const types: any = {
      Residential: 'Residential',
      Multifamily: 'Multifamily',
      MixedUse: 'Mixed Use',
      Industrial: 'Industrial',
      Agricultural: 'Agricultural',
      SpecialPurpose: 'Special Purpose',
    };
    return types[type] || type;
  };

  const getStageDisplay = (stage: string) => {
    const stages: any = {
      PreDevelopment: 'Pre-Development',
      Construction: 'Construction',
      Stabilized: 'Stabilized',
      Exit: 'Exit',
    };
    return stages[stage] || stage;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Green':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Yellow':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Red':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const totalInvestment = properties.reduce((sum, p) => sum + p.totalProjectCost, 0);
  const totalEquity = properties.reduce((sum, p) => sum + p.equityInvested, 0);
  const avgTargetIRR = properties.length > 0
    ? properties.reduce((sum, p) => sum + (p.targetIRR || 0), 0) / properties.filter(p => p.targetIRR).length
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackButton />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Properties</h1>
          <p className="text-gray-600">Real Estate Development Portfolio</p>
        </div>
        <Link href="/properties/new">
          <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            New Property
          </Button>
        </Link>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Total Investment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompactNumber(totalInvestment)}</div>
            <p className="text-xs text-gray-500 mt-1">{properties.length} properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Building2 className="w-4 h-4 mr-2" />
              Total Equity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompactNumber(totalEquity)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((totalEquity / totalInvestment) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Avg Target IRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(avgTargetIRR)}</div>
            <p className="text-xs text-gray-500 mt-1">Portfolio average</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Asset Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Asset Types</SelectItem>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Multifamily">Multifamily</SelectItem>
                  <SelectItem value="MixedUse">Mixed Use</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                  <SelectItem value="Agricultural">Agricultural</SelectItem>
                  <SelectItem value="SpecialPurpose">Special Purpose</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Development Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="PreDevelopment">Pre-Development</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Stabilized">Stabilized</SelectItem>
                  <SelectItem value="Exit">Exit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Properties List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading properties...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {searchTerm || assetTypeFilter !== 'all' || stageFilter !== 'all'
              ? 'No properties match your filters'
              : 'No properties yet'}
          </p>
          {!searchTerm && assetTypeFilter === 'all' && stageFilter === 'all' && (
            <Link href="/properties/new">
              <Button>Create your first property</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Link href={`/properties/${property.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{property.name}</h3>
                        <p className="text-sm text-gray-600">
                          {property.city}, {property.state}
                        </p>
                      </div>
                      <Badge className={getStatusColor(property.statusIndicator)}>
                        {property.statusIndicator}
                      </Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {getAssetTypeDisplay(property.assetType)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getStageDisplay(property.developmentStage)}
                      </Badge>
                      {property.units && (
                        <Badge variant="outline" className="text-xs">
                          {property.units} units
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Total Project Cost</p>
                        <p className="font-semibold text-lg">
                          {formatCompactNumber(property.totalProjectCost)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-600">Equity</p>
                          <p className="font-medium">
                            {formatCompactNumber(property.equityInvested)}
                          </p>
                        </div>
                        {property.targetIRR && (
                          <div>
                            <p className="text-xs text-gray-600">Target IRR</p>
                            <p className="font-medium">
                              {formatPercentage(property.targetIRR)}
                            </p>
                          </div>
                        )}
                      </div>

                      {property.project && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-600">Linked Project</p>
                          <p className="text-sm font-medium">{property.project.name}</p>
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <Button variant="ghost" size="sm">
                          View Details
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
