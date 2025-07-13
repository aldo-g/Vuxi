"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Plus, Eye, TrendingUp, ArrowRight } from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      title: "Create New Analysis",
      description: "Start a comprehensive UX analysis of any website",
      icon: Plus,
      href: "/create-analysis",
      color: "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
      bgColor: "from-purple-500 to-pink-600"
    },
    {
      title: "View Example Reports",
      description: "Browse through sample UX analysis reports and insights",
      icon: Eye,
      href: "/reports",
      color: "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
      bgColor: "from-blue-500 to-indigo-600"
    },
    {
      title: "Latest Analysis",
      description: "Quick access to the most recent UX evaluation report",
      icon: TrendingUp,
      href: "/reports",
      color: "border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700",
      bgColor: "from-emerald-500 to-green-600",
      variant: "outline" as const
    }
  ];

  return (
    <div className="grid gap-8 md:grid-cols-3 mb-16">
      {actions.map((action) => {
        const IconComponent = action.icon;
        return (
          <Card 
            key={action.title} 
            className="group hover:shadow-xl transition-all duration-300 border-slate-200/80 bg-white/90 backdrop-blur-sm hover:scale-[1.02]"
          >
            <CardHeader className="pb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${action.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                {action.title}
              </CardTitle>
              <CardDescription className="text-slate-600 text-base">
                {action.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={action.href}>
                <Button 
                  className={`w-full font-semibold py-3 group ${
                    action.variant === 'outline' 
                      ? action.color 
                      : `bg-gradient-to-r ${action.color} text-white`
                  }`}
                  variant={action.variant || "default"}
                >
                  <IconComponent className="mr-2 h-5 w-5" />
                  {action.title.includes('New') ? 'Start Analysis' : 
                   action.title.includes('Example') ? 'Browse Examples' : 'View Latest'}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}