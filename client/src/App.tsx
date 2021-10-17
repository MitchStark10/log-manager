import 'bootstrap/dist/css/bootstrap.css';
import React, { useCallback, useEffect } from 'react';
import { Route, Switch } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import './App.scss';
import AlarmList from './components/alarms/AlarmList';
import Header from './components/Header';
import SignOut from './components/user/SignOut';
import Documentation from './pages/Documentation';
import Features from './pages/Features';
import LoginNewUserPage from './pages/LoginNewUserPage';
import Pricing from './pages/Pricing';
import {useAssigneeOptionsStore} from './stores/useAssigneeOptionsStore';
import LOGIN_STATES from './utils/LoginStates';

interface AssigneeOptionApiResponse {
    AssigneeID: string;
}

function App() {
    const [email, setEmail] = React.useState<string | null>(null);
    const [loginState, setLoginState] = React.useState(LOGIN_STATES.LOADING);
    const setAssigneeOptions = useAssigneeOptionsStore((state) => state.setAssigneeOptions);

    const storeLoginInfo = useCallback((email: string) => {
        localStorage.setItem('userEmail', email);
        setEmail(email);
    }, []);

    React.useEffect(() => {
        const email = localStorage.getItem('userEmail');

        if (!email) {
            setLoginState(LOGIN_STATES.UNAUTHENTICATED);
            return;
        }

        fetch('/api/public/account/loginWithCookie')
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    setEmail(email);
                    setLoginState(LOGIN_STATES.LOGGED_IN);
                } else {
                    storeLoginInfo('');
                    setLoginState(LOGIN_STATES.UNAUTHENTICATED);
                }
            })
            .catch(() => {
                storeLoginInfo('');
                setLoginState(LOGIN_STATES.UNAUTHENTICATED);
            });


        fetch('/api/bootstrap/logPageLoad', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                alarmTitle: 'Visit Occurred',
                alarmDetails: 'URL: ' + window.location.pathname,
            }),
        });
    }, []);

    useEffect(() => {
        if (email) {
            console.log('email', email);
            fetch('/api/authenticated/assignees/getAssignees', {
                method: 'POST',
                body: JSON.stringify({email}),
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then((response) => response.json()).then((data) => {
                setAssigneeOptions(data.result.map((option: AssigneeOptionApiResponse) => option.AssigneeID));
            }).catch((error) => {
                console.error('Error retrieving assignee list', error);
            });
        }
    }, [email]);

    if (loginState === LOGIN_STATES.LOADING) {
        return null;
    }

    return (
        <>
            <Header userEmail={email} />
            <BrowserRouter>
                <Switch>
                    <Route path="/login">
                        <LoginNewUserPage setLoginState={setLoginState} storeLoginInfo={storeLoginInfo} />
                    </Route>
                    <Route path="/sign-out">
                        <SignOut setEmail={storeLoginInfo} />
                    </Route>
                    <Route path="/features">
                        <Features />
                    </Route>
                    <Route path="/pricing">
                        <Pricing />
                    </Route>
                    <Route path="/documentation">
                        <Documentation />
                    </Route>
                    <Route path="/">
                        <AlarmList email={email} />
                    </Route>
                </Switch>
            </BrowserRouter>
        </>
    );
}

export default App;
