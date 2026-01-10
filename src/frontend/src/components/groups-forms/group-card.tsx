"use client";

import Link from "next/link";
import { Users, Lock, Globe, ShieldCheck, Crown } from "lucide-react";
import { GroupDto } from "@frontend/lib/types/groups";
import { Card, CardContent, CardFooter } from "@frontend/components/ui/card";
import { Button } from "@frontend/components/ui/button";
import { Badge } from "@frontend/components/ui/badge";
import { getInitials } from "@frontend/lib/utils";

interface GroupCardProps {
  group: GroupDto;
}

export function GroupCard({ group }: GroupCardProps) {
  const memberLabel = group.membersCount === 1 ? "член" : "членове";

  const isPrivateData = group.isPrivate ? "Частна" : "Публична"

  return (
    <Card className="hover:shadow-md transition-all duration-300 flex flex-col h-full border-gray-200 group">
      <CardContent className="pt-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="h-16 w-16 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
            {getInitials(group.name)}
          </div>
          <div className="flex flex-col items-end gap-2">
            
            {isPrivateData === "Частна" ? (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 gap-1">
                <Lock className="w-3 h-3" /> Частна
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 gap-1">
                <Globe className="w-3 h-3" /> Публична
              </Badge>
            )}

            {group.isOwner && (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 gap-1">
                <Crown className="w-3 h-3" /> Собственик
              </Badge>
            )}
            {!group.isOwner && group.isAdmin && (
              <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200 gap-1">
                <ShieldCheck className="w-3 h-3" /> Админ
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Link href={`/groups/${group.name}`} className="block">
            <h3 className="font-bold text-lg leading-tight text-gray-900 line-clamp-1 group-hover:text-primary transition-colors" title={group.name}>
                {group.name}
            </h3>
          </Link>
          
          <p className="text-sm text-muted-foreground line-clamp-2 h-10">
            {group.description || "Няма добавено описание за тази група."}
          </p>

          <div className="flex items-center text-sm text-gray-500 pt-1">
            <Users className="w-4 h-4 mr-1.5" />
            <span className="font-medium text-gray-700">{group.membersCount}</span>
            <span className="ml-1">{memberLabel}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-5 px-6 border-t bg-gray-50/30">
        <Link href={`/groups/${group.name}`} className="w-full">
            <Button variant="outline" className="w-full font-semibold border-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
                Към групата
            </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}