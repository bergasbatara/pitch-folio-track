import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Package, ShoppingCart, TrendingUp, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: 'Company Profile',
    description: 'Set up your business details and preferences',
  },
  {
    icon: Package,
    title: 'Product Management',
    description: 'Add and manage your inventory and products',
  },
  {
    icon: ShoppingCart,
    title: 'Sales & Purchases',
    description: 'Track all your transactions in one place',
  },
  {
    icon: TrendingUp,
    title: 'Financial Reports',
    description: 'Generate comprehensive business reports',
  },
];

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome to Asia Global Financial
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your complete solution for managing retail business operations, inventory, and financial reporting.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-primary/20 bg-card">
          <CardHeader className="text-center">
            <CardTitle>Let's Get Started</CardTitle>
            <CardDescription>
              Set up your company profile to begin using Asia Global Financial
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/onboarding/company-setup')}
              className="gap-2"
            >
              Set Up Company Profile
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
