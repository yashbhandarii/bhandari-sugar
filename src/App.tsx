import { Route, Switch } from 'wouter';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import InvoiceBuilder from './pages/InvoiceBuilder';
import InvoiceList from './pages/InvoiceList';
import CustomerManagement from './pages/CustomerManagement';
import GodownManagement from './pages/GodownManagement';
import Reports from './pages/Reports';
import InventoryDistribution from './pages/InventoryDistribution';
import PurchaseEntry from './pages/PurchaseEntry';

function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/invoices/new" component={InvoiceBuilder} />
        <Route path="/invoices" component={InvoiceList} />
        <Route path="/customers" component={CustomerManagement} />
        <Route path="/godowns" component={GodownManagement} />
        <Route path="/purchase-entry" component={PurchaseEntry} />
        <Route path="/inventory-distribution" component={InventoryDistribution} />
        <Route path="/reports" component={Reports} />
        <Route>404 - Page Not Found</Route>
      </Switch>
    </Layout>
  );
}

export default App;
