!  calcs.f90 
!
!  FUNCTIONS:
!  calcs - Entry point of console application.
!

!****************************************************************************
!
!  PROGRAM: calcs
!
!  PURPOSE:  Entry point for the console application.
!
!****************************************************************************

    program calcs

    implicit none

    ! Variables
    integer i, j, k
    real*8 s
    
    open(1, file='C:\Users\tiama\OneDrive\Рабочий стол\TWP3\html\triplets.txt', FORM='FORMATTED')
    do i = 0, 12
        do j = 0, 12
            do k = 0, 12
                s = sqrt(real(i**2+j**2+k**2))
                if (aint(s)==s) then
                    write(1,*) '[', i, ',', j, ',', k,'],'
                endif    
            enddo
        enddo
    enddo    
    
    ! Body of calcs
    print *, 'Hello World'

    end program calcs

