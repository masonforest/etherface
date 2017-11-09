import React from 'react'
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'
import Contract from './components/Contract';
import Home from './Home';


const App = () => (
  <Router>
    <div className="container">
      <nav>
        <h1>Etherface</h1>
        <ul>
          <li><Link to="/">Home</Link></li>
        </ul>
        <h2>Tokens</h2>
        <ul>
          <Link to="/contracts/EthUSD">EthUSD</Link>
        </ul>
      </nav>
      <main>
        <Route exact path="/" component={Home}/>
        <Route path="/contracts/:contractId" component={Contract}/>
      </main>
    </div>
  </Router>
)
export default App
