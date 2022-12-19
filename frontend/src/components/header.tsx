import * as React from 'react';
import { AppBar, Box, IconButton, ListItemIcon, Menu, MenuItem, Toolbar, Tooltip, Typography } from '@mui/material';
import { AccountCircle, Logout } from '@mui/icons-material';
import { useAuth } from '../hooks/use-auth';
import { useRouter } from 'next/router';
import { BaseSyntheticEvent } from 'react';
import Link from '@mui/material/Link';

const Header = () => {
  return (
    <AppBar
      position={'static'}
      style={{ backgroundColor: 'rgb(55 65 81)' }}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        <AccountMenu />
      </Toolbar>
    </AppBar>
  );
};

const AccountMenu = () => {
  const router = useRouter();
  const auth = useAuth();
  const signOut = async (e: any) => {
    e.preventDefault();
    await auth.signOut().then(() => router.push('/signin'));
  };

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: BaseSyntheticEvent) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <React.Fragment>
      <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center', width: '100%' }}>
        <Typography variant='h5' component={'div'} className={'ml-4 text-white'} sx={{ flexGrow: 1 }}>
          <Box textAlign='left'>
            <Link href={'/'} underline={'none'} color={'inherit'}>
              Demo page
            </Link>
          </Box>
        </Typography>

        {auth.isAuthenticated && (
          <Tooltip title='Sign Out'>
            <IconButton
              edge={'end'}
              onClick={handleClick}
              size='small'
              sx={{ ml: 2 }}
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup='true'
              aria-expanded={open ? 'true' : undefined}
            >
              <AccountCircle />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {auth.isAuthenticated && (
        <Menu
          anchorEl={anchorEl}
          id='account-menu'
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                backgroundColor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={signOut}>
            <ListItemIcon>
              <Logout fontSize='small' />
            </ListItemIcon>
            Sign out
          </MenuItem>
        </Menu>
      )}
    </React.Fragment>
  );
};

export default Header;
