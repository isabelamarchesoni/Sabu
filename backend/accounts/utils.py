def usuario_e_admin(user):
    return user.is_authenticated and getattr(user, 'cargo', None) == 'ADMIN'