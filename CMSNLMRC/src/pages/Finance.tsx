import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, FileText, Plus, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const financialTransactions = [
  { id: 1, date: "2025-10-07", category: "Donations", description: "Monthly Donor Contribution", amount: 50000, type: "Income", reference: "DON-001" },
  { id: 2, date: "2025-10-06", category: "Operating Expenses", description: "Food Supplies", amount: -15000, type: "Expense", reference: "EXP-045" },
  { id: 3, date: "2025-10-05", category: "Education", description: "School Fees Payment", amount: -20000, type: "Expense", reference: "EXP-044" },
  { id: 4, date: "2025-10-04", category: "Grants", description: "Government Grant", amount: 100000, type: "Income", reference: "GRT-012" },
  { id: 5, date: "2025-10-03", category: "Utilities", description: "Electricity Bill", amount: -8000, type: "Expense", reference: "EXP-043" },
];

const Finance = () => {
  const totalIncome = financialTransactions.filter(t => t.type === "Income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(financialTransactions.filter(t => t.type === "Expense").reduce((sum, t) => sum + t.amount, 0));
  const balance = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 h-24 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            Finance Management
          </h1>
          <p className="text-sm sm:text-base text-white/90">Financial tracking and budget management</p>
        </div>
        <div className="relative flex gap-2">
          <Button className="bg-white text-emerald-600 hover:bg-emerald-50">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
          <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-t-4 border-t-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">KES {totalIncome.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">TOTAL INCOME</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-red-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">KES {totalExpenses.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">TOTAL EXPENSES</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">KES {balance.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">NET BALANCE</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{financialTransactions.length}</p>
                  <p className="text-sm text-muted-foreground">TRANSACTIONS</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Transactions</CardTitle>
            <p className="text-sm text-muted-foreground">Financial activity and transaction history</p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-emerald-600 to-teal-600">
                  <TableRow>
                    <TableHead className="text-white font-semibold">DATE</TableHead>
                    <TableHead className="text-white font-semibold">CATEGORY</TableHead>
                    <TableHead className="text-white font-semibold">DESCRIPTION</TableHead>
                    <TableHead className="text-white font-semibold">REFERENCE</TableHead>
                    <TableHead className="text-white font-semibold">TYPE</TableHead>
                    <TableHead className="text-white font-semibold text-right">AMOUNT (KES)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-emerald-600" />
                          <span>{transaction.date}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                          {transaction.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{transaction.reference}</code>
                      </TableCell>
                      <TableCell>
                        <Badge className={transaction.type === "Income" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}>
                          {transaction.type === "Income" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold ${transaction.type === "Income" ? "text-green-600" : "text-red-600"}`}>
                          {transaction.type === "Income" ? "+" : ""}{transaction.amount.toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Finance;
