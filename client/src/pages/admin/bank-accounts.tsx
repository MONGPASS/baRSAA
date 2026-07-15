import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BankAccount } from "@shared/schema";

import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BankAccountForm } from "@/components/admin/bank-account-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Plus, Pencil, Trash2, CheckCircle } from "lucide-react";

export default function BankAccounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null,
  );
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(
    null,
  );

  // Fetch bank accounts
  const { data: bankAccounts = [], isLoading } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  // Mutation for setting default bank account
  const setDefaultMutation = useMutation({
    mutationFn: async (accountId: number) => {
      return apiRequest("POST", `/api/bank-accounts/${accountId}/set-default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: "Үндсэн данс шинэчлэгдлээ",
        description: "Үндсэн дансны тохиргоо амжилттай хадгалагдлаа.",
      });
    },
    onError: (error) => {
      console.error("Error setting default account:", error);
      toast({
        title: "Алдаа гарлаа",
        description:
          "Үндсэн данс тохируулахад алдаа гарлаа. Дахин оролдоно уу.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a bank account
  const deleteMutation = useMutation({
    mutationFn: async (accountId: number) => {
      return apiRequest("DELETE", `/api/bank-accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: "Данс устгагдлаа",
        description: "Банкны данс амжилттай устгагдлаа.",
      });
      setAccountToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting bank account:", error);
      toast({
        title: "Алдаа гарлаа",
        description: "Данс устгахад алдаа гарлаа. Дахин оролдоно уу.",
        variant: "destructive",
      });
    },
  });

  const handleAddNew = () => {
    setSelectedAccount(null);
    setIsFormOpen(true);
  };

  const handleEdit = (account: BankAccount) => {
    setSelectedAccount(account);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedAccount(null);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
    setIsFormOpen(false);
    setSelectedAccount(null);
  };

  const handleSetDefault = (account: BankAccount) => {
    if (!account.isDefault) {
      setDefaultMutation.mutate(account.id);
    }
  };

  const handleDeleteClick = (account: BankAccount) => {
    setAccountToDelete(account);
  };

  const handleConfirmDelete = () => {
    if (accountToDelete) {
      deleteMutation.mutate(accountToDelete.id);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <AdminHeader title="Админ удирдлага - Банкны данс" />

      {isFormOpen ? (
        <BankAccountForm
          bankAccount={selectedAccount || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleCloseForm}
        />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Банкны данснууд</CardTitle>
            <Button onClick={handleAddNew} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Шинэ данс нэмэх
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <p>Ачааллаж байна...</p>
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-muted-foreground mb-4">
                  Одоогоор бүртгэлтэй банкны данс байхгүй байна.
                </p>
                <Button onClick={handleAddNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Шинэ данс бүртгэх
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Банкны нэр</TableHead>
                    <TableHead>Дансны дугаар</TableHead>
                    <TableHead>Данс эзэмшигч</TableHead>
                    <TableHead className="w-[100px]">Үндсэн данс</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts.map((account: BankAccount) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        {account.bankName}
                      </TableCell>
                      <TableCell>{account.accountNumber}</TableCell>
                      <TableCell>{account.accountHolder}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Switch
                            checked={account.isDefault}
                            onCheckedChange={() => handleSetDefault(account)}
                            disabled={
                              account.isDefault || setDefaultMutation.isPending
                            }
                          />
                          {account.isDefault && (
                            <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Үйлдэл</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEdit(account)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Засах
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(account)}
                              disabled={account.isDefault}
                              className={
                                account.isDefault
                                  ? "text-muted-foreground"
                                  : "text-destructive"
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Устгах
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!accountToDelete}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Та итгэлтэй байна уу?</AlertDialogTitle>
            <AlertDialogDescription>
              Энэ үйлдлийг буцаах боломжгүй. Энэ нь {accountToDelete?.bankName}{" "}
              банкны {accountToDelete?.accountNumber} дугаартай дансыг систэмээс
              бүр мөсөн устгах болно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Болих</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Устгах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
